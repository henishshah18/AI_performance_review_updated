#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from reviews.views import generate_ai_draft_content

# Test data
test_context = {
    'employee': {
        'name': 'John Doe',
        'role': 'Senior Software Engineer',
        'department': 'Engineering'
    },
    'cycle': {
        'period': 'Q4 2024'
    },
    'self_assessment': {
        'responses': {
            'technical_excellence': 4,
            'collaboration': 4,
            'problem_solving': 5,
            'initiative': 4
        }
    },
    'peer_reviews': {
        'count': 3,
        'average_ratings': {
            'technical_excellence': 4.2,
            'collaboration': 4.5,
            'problem_solving': 4.8,
            'initiative': 4.1
        },
        'comments': [
            'Great technical skills and always willing to help',
            'Excellent problem solver and team player',
            'Shows strong initiative in improving processes'
        ]
    },
    'previous_reviews': [
        {'key_feedback': 'Strong technical performer, needs to work on documentation'},
        {'key_feedback': 'Excellent collaboration, continue leadership development'}
    ],
    'recent_feedback': [
        {'content': 'Led the API migration project successfully'},
        {'content': 'Mentored junior developers effectively'},
        {'content': 'Improved system performance significantly'}
    ]
}

print("Testing AI Draft Generation...")
print("=" * 50)

# Test just technical excellence first
category = 'technical_excellence'
print(f"\n--- Testing {category.upper()} ---")
try:
    result = generate_ai_draft_content(category, test_context)
    print("SUCCESS!")
    print("Generated content:")
    print("-" * 30)
    print(result)
    print("-" * 30)
except Exception as e:
    print(f"ERROR: {e}")

print("Test completed!") 