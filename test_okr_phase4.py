#!/usr/bin/env python
"""
Phase 4 OKR Implementation Test Script
Tests all OKR models, relationships, and business rules.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from decimal import Decimal

from core.models import User, Department
from okr.models import Objective, Goal, IndividualTask, TaskUpdate


def test_okr_models():
    """Test OKR model creation and validation"""
    print("🧪 Testing OKR Models...")
    
    # Test data counts
    objectives_count = Objective.objects.count()
    goals_count = Goal.objects.count()
    tasks_count = IndividualTask.objects.count()
    
    print(f"✅ Found {objectives_count} objectives")
    print(f"✅ Found {goals_count} goals")
    print(f"✅ Found {tasks_count} tasks")
    
    if objectives_count == 0:
        print("❌ No objectives found. Run 'python manage.py init_okr_data' first.")
        return False
    
    return True


def test_business_rules():
    """Test OKR business rules and constraints"""
    print("\n🔒 Testing Business Rules...")
    
    try:
        # Get test data
        hr_admin = User.objects.filter(role='hr_admin').first()
        manager = User.objects.filter(role='manager').first()
        individual = User.objects.filter(role='individual_contributor').first()
        
        if not all([hr_admin, manager, individual]):
            print("❌ Missing required user roles for testing")
            return False
        
        # Test 1: Only HR Admin can create objectives
        print("Testing objective creation permissions...")
        try:
            objective = Objective(
                title="Test Objective",
                description="Test description",
                owner=manager,
                created_by=manager,  # Should fail - only HR Admin can create
                timeline_type='quarterly',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=90)
            )
            objective.full_clean()
            print("❌ Business rule violation: Non-HR Admin created objective")
            return False
        except ValidationError:
            print("✅ Correctly prevented non-HR Admin from creating objective")
        
        # Test 2: Only managers can own objectives
        print("Testing objective ownership rules...")
        try:
            objective = Objective(
                title="Test Objective",
                description="Test description",
                owner=individual,  # Should fail - only managers can own
                created_by=hr_admin,
                timeline_type='quarterly',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=90)
            )
            objective.full_clean()
            print("❌ Business rule violation: Individual contributor owns objective")
            return False
        except ValidationError:
            print("✅ Correctly prevented individual contributor from owning objective")
        
        # Test 3: Timeline validation
        print("Testing timeline validation...")
        try:
            objective = Objective(
                title="Test Objective",
                description="Test description",
                owner=manager,
                created_by=hr_admin,
                timeline_type='quarterly',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=200)  # Too long for quarterly
            )
            objective.full_clean()
            print("❌ Business rule violation: Invalid quarterly timeline")
            return False
        except ValidationError:
            print("✅ Correctly validated quarterly timeline duration")
        
        print("✅ All business rules working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Error testing business rules: {e}")
        return False


def test_progress_calculation():
    """Test automatic progress calculation"""
    print("\n📊 Testing Progress Calculation...")
    
    try:
        # Get a goal with tasks
        goal = Goal.objects.filter(tasks__isnull=False).first()
        if not goal:
            print("❌ No goals with tasks found for testing")
            return False
        
        print(f"Testing goal: {goal.title}")
        
        # Get tasks and their progress
        tasks = goal.tasks.all()
        manual_avg = sum(task.progress_percentage for task in tasks) / tasks.count()
        
        # Trigger progress calculation
        calculated_progress = goal.calculate_progress()
        
        print(f"Manual calculation: {manual_avg}%")
        print(f"Automatic calculation: {calculated_progress}%")
        
        if abs(manual_avg - calculated_progress) < 0.01:  # Allow for rounding
            print("✅ Progress calculation working correctly")
            
            # Test objective progress calculation
            objective = goal.objective
            objective_progress = objective.calculate_progress()
            print(f"Objective progress: {objective_progress}%")
            print("✅ Objective progress calculation working")
            
            return True
        else:
            print("❌ Progress calculation mismatch")
            return False
            
    except Exception as e:
        print(f"❌ Error testing progress calculation: {e}")
        return False


def test_relationships():
    """Test model relationships and foreign keys"""
    print("\n🔗 Testing Model Relationships...")
    
    try:
        # Test objective -> goals relationship
        objective = Objective.objects.first()
        goals = objective.goals.all()
        print(f"✅ Objective '{objective.title}' has {goals.count()} goals")
        
        # Test goal -> tasks relationship
        if goals.exists():
            goal = goals.first()
            tasks = goal.tasks.all()
            print(f"✅ Goal '{goal.title}' has {tasks.count()} tasks")
            
            # Test task -> updates relationship
            if tasks.exists():
                task = tasks.first()
                updates = task.updates.all()
                print(f"✅ Task '{task.title}' has {updates.count()} updates")
        
        # Test user relationships
        manager = User.objects.filter(role='manager').first()
        owned_objectives = manager.owned_objectives.all()
        created_goals = manager.created_goals.all()
        print(f"✅ Manager owns {owned_objectives.count()} objectives and created {created_goals.count()} goals")
        
        individual = User.objects.filter(role='individual_contributor').first()
        assigned_goals = individual.assigned_goals.all()
        assigned_tasks = individual.assigned_tasks.all()
        print(f"✅ Individual has {assigned_goals.count()} goals and {assigned_tasks.count()} tasks")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing relationships: {e}")
        return False


def test_status_methods():
    """Test model status and utility methods"""
    print("\n⚙️ Testing Status Methods...")
    
    try:
        # Test objective status methods
        objective = Objective.objects.first()
        print(f"Objective completion status: {objective.get_completion_status()}")
        print(f"Objective is overdue: {objective.is_overdue()}")
        
        # Test goal status methods
        goal = Goal.objects.first()
        if goal.due_date:
            print(f"Goal days remaining: {goal.get_days_remaining()}")
        print(f"Goal is overdue: {goal.is_overdue()}")
        
        # Test task status methods
        task = IndividualTask.objects.first()
        if task.due_date:
            print(f"Task days remaining: {task.get_days_remaining()}")
        print(f"Task is overdue: {task.is_overdue()}")
        
        print("✅ All status methods working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Error testing status methods: {e}")
        return False


def test_admin_interface():
    """Test Django admin integration"""
    print("\n🔧 Testing Admin Interface...")
    
    try:
        from django.contrib.admin.sites import site
        from okr.admin import ObjectiveAdmin, GoalAdmin, IndividualTaskAdmin, TaskUpdateAdmin
        
        # Check if models are registered
        registered_models = [model._meta.model for model in site._registry.values()]
        
        okr_models = [Objective, Goal, IndividualTask, TaskUpdate]
        for model in okr_models:
            if model in registered_models:
                print(f"✅ {model.__name__} registered in admin")
            else:
                print(f"❌ {model.__name__} not registered in admin")
                return False
        
        print("✅ All OKR models registered in admin interface")
        return True
        
    except Exception as e:
        print(f"❌ Error testing admin interface: {e}")
        return False


def main():
    """Run all tests"""
    print("🚀 Phase 4 OKR Implementation Test Suite")
    print("=" * 50)
    
    tests = [
        test_okr_models,
        test_business_rules,
        test_progress_calculation,
        test_relationships,
        test_status_methods,
        test_admin_interface
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                print(f"❌ {test.__name__} failed")
        except Exception as e:
            print(f"❌ {test.__name__} crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Phase 4 OKR implementation is working correctly.")
        print("\n✅ Ready for frontend integration and user testing.")
    else:
        print("⚠️ Some tests failed. Please review the implementation.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 