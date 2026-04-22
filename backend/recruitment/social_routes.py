"""Recruitment: Social interactions — Likes, Comments (threaded), Bookmarks, Shares"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from database import db
from utils.auth_helpers import get_current_student
from models.recruitment_models import CommentCreate

router = APIRouter()

# === Like / Unlike Post ===
@router.post("/recruitment/posts/{post_id}/like")
async def toggle_like(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    existing = await db.recruitment_likes.find_one({"user_id": user["id"], "post_id": post_id})
    if existing:
        await db.recruitment_likes.delete_one({"user_id": user["id"], "post_id": post_id})
        await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": max((post.get("likes_count", 0) - 1), 0)}
    await db.recruitment_likes.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "post_id": post_id, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
    return {"liked": True, "likes_count": post.get("likes_count", 0) + 1}

# === Comments (threaded) ===
@router.post("/recruitment/posts/{post_id}/comment")
async def add_comment(post_id: str, data: CommentCreate, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    if data.parent_id:
        parent = await db.recruitment_comments.find_one({"id": data.parent_id, "post_id": post_id})
        if not parent:
            raise HTTPException(404, "Parent comment not found")
    comment = {"id": str(uuid.uuid4()), "post_id": post_id, "user_id": user["id"], "user_name": user.get("name", "Anonymous"), "user_avatar": user.get("profile_picture") or user.get("avatar", ""), "text": data.text.strip(), "parent_id": data.parent_id, "likes_count": 0, "replies_count": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.recruitment_comments.insert_one(comment.copy())
    comment.pop("_id", None)
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    if data.parent_id:
        await db.recruitment_comments.update_one({"id": data.parent_id}, {"$inc": {"replies_count": 1}})
    return comment

@router.get("/recruitment/posts/{post_id}/comments")
async def get_comments(post_id: str, request: Request):
    top_comments = await db.recruitment_comments.find({"post_id": post_id, "$or": [{"parent_id": None}, {"parent_id": {"$exists": False}}]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    reply_ids = [c["id"] for c in top_comments]
    all_replies = await db.recruitment_comments.find({"post_id": post_id, "parent_id": {"$in": reply_ids}}, {"_id": 0}).sort("created_at", 1).to_list(500)
    liked_comment_ids = []
    try:
        user = await get_current_student(request)
        likes = await db.recruitment_comment_likes.find({"user_id": user["id"], "post_id": post_id}, {"_id": 0, "comment_id": 1}).to_list(500)
        liked_comment_ids = [l["comment_id"] for l in likes]
    except:
        pass
    reply_map = {}
    for r in all_replies:
        pid = r["parent_id"]
        if pid not in reply_map:
            reply_map[pid] = []
        r["is_liked"] = r["id"] in liked_comment_ids
        reply_map[pid].append(r)
    for c in top_comments:
        c["replies"] = reply_map.get(c["id"], [])
        c["is_liked"] = c["id"] in liked_comment_ids
    return {"comments": top_comments}

@router.post("/recruitment/comments/{comment_id}/like")
async def toggle_comment_like(comment_id: str, request: Request):
    user = await get_current_student(request)
    comment = await db.recruitment_comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(404, "Comment not found")
    existing = await db.recruitment_comment_likes.find_one({"user_id": user["id"], "comment_id": comment_id})
    if existing:
        await db.recruitment_comment_likes.delete_one({"user_id": user["id"], "comment_id": comment_id})
        await db.recruitment_comments.update_one({"id": comment_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": max((comment.get("likes_count", 0) - 1), 0)}
    await db.recruitment_comment_likes.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "comment_id": comment_id, "post_id": comment.get("post_id"), "created_at": datetime.now(timezone.utc).isoformat()})
    await db.recruitment_comments.update_one({"id": comment_id}, {"$inc": {"likes_count": 1}})
    return {"liked": True, "likes_count": comment.get("likes_count", 0) + 1}

# === Bookmark ===
@router.post("/recruitment/posts/{post_id}/bookmark")
async def toggle_bookmark(post_id: str, request: Request):
    user = await get_current_student(request)
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    existing = await db.recruitment_bookmarks.find_one({"user_id": user["id"], "post_id": post_id})
    if existing:
        await db.recruitment_bookmarks.delete_one({"user_id": user["id"], "post_id": post_id})
        return {"bookmarked": False}
    await db.recruitment_bookmarks.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "post_id": post_id, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"bookmarked": True}

@router.get("/recruitment/my-bookmarks")
async def get_my_bookmarks(request: Request):
    user = await get_current_student(request)
    bookmarks = await db.recruitment_bookmarks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    post_ids = [b["post_id"] for b in bookmarks]
    posts = []
    for pid in post_ids:
        post = await db.recruitment_posts.find_one({"id": pid}, {"_id": 0})
        if post:
            company = await db.recruiters.find_one({"id": post["company_id"]}, {"_id": 0, "password_hash": 0})
            if company:
                post["company_name"] = company.get("company_name", "")
                post["company_logo"] = company.get("logo_url", "")
                post["company_slug"] = company.get("slug", "")
            posts.append(post)
    return {"posts": posts}

# === Share ===
@router.post("/recruitment/posts/{post_id}/share")
async def share_post(post_id: str):
    post = await db.recruitment_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(404, "Post not found")
    await db.recruitment_posts.update_one({"id": post_id}, {"$inc": {"shares_count": 1}})
    pt = post.get("post_type")
    share_url = f"/quiz-recruit/{post_id}" if pt == "quiz" else f"/hackathon/{post_id}" if pt == "hackathon" else f"/apply/{post_id}"
    return {"shared": True, "share_url": share_url}

# === User Interactions ===
@router.get("/recruitment/my-interactions")
async def get_my_interactions(request: Request):
    user = await get_current_student(request)
    likes = await db.recruitment_likes.find({"user_id": user["id"]}, {"_id": 0, "post_id": 1}).to_list(500)
    bookmarks = await db.recruitment_bookmarks.find({"user_id": user["id"]}, {"_id": 0, "post_id": 1}).to_list(500)
    return {"liked_post_ids": [l["post_id"] for l in likes], "bookmarked_post_ids": [b["post_id"] for b in bookmarks]}
