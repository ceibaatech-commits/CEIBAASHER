#!/usr/bin/env python3

import os
import sys
sys.path.append('/app')

from backend_test import BackendTester

def main():
    """Run only the Ceibaa bug fix tests"""
    tester = BackendTester()
    
    print("🎯 TESTING CEIBAA QUIZ PLATFORM BUG FIXES")
    print("=" * 60)
    
    success = tester.test_ceibaa_quiz_platform_bug_fixes()
    
    print("\n📋 Detailed Results:")
    for result in tester.results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['name']}: {result['message']}")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)