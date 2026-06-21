from cbse_master_data import (
    get_subjects_for_class as get_cbse_subjects_for_class,
    get_chapters_for_subject as get_cbse_chapters_for_subject,
    get_all_cbse_data as get_cbse_all_data,
)


def _normalize_board(board: str | None) -> str:
    return (board or 'cbse').strip().lower()


def get_subjects_for_board_class(class_num: str, stream: str = None, board: str | None = None) -> list:
    """Get subjects for a class on the requested board."""
    normalized_board = _normalize_board(board)

    if normalized_board == 'rbse' and class_num in ['6', '7', '8', '9', '10']:
        return get_cbse_subjects_for_class(class_num, stream)

    return get_cbse_subjects_for_class(class_num, stream)


def get_chapters_for_board_subject(class_num: str, subject_slug: str, stream: str = None, board: str | None = None) -> list:
    """Get chapters for a subject on the requested board."""
    normalized_board = _normalize_board(board)

    if normalized_board == 'rbse' and class_num in ['6', '7', '8', '9', '10']:
        return get_cbse_chapters_for_subject(class_num, subject_slug, stream)

    return get_cbse_chapters_for_subject(class_num, subject_slug, stream)


def get_all_board_data(board: str | None = None) -> dict:
    """Get all board data for admin/class subject dropdowns."""
    normalized_board = _normalize_board(board)

    if normalized_board == 'rbse':
        return {
            'subjects': {
                class_num: get_cbse_all_data()['subjects'].get(class_num, {})
                for class_num in ['6', '7', '8', '9', '10']
            },
            'chapters': {
                class_num: get_cbse_all_data()['chapters'].get(class_num, {})
                for class_num in ['6', '7', '8', '9', '10']
            },
        }

    return get_cbse_all_data()
