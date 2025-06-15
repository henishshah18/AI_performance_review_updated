#!/usr/bin/env python
"""
Master QA Test Runner for AI Performance Review Platform
Runs all phase tests and provides comprehensive reporting.
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def run_test_script(script_path, phase_name):
    """Run a test script and capture results"""
    print(f"\n{'='*80}")
    print(f"🚀 RUNNING {phase_name.upper()} TESTS")
    print(f"{'='*80}")
    
    start_time = time.time()
    
    try:
        # Set environment variables for Django
        env = os.environ.copy()
        env['PYTHONPATH'] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env['DJANGO_SETTINGS_MODULE'] = 'performance_management.settings'
        
        # Run the test script from the project root
        result = subprocess.run([
            sys.executable, script_path
        ], capture_output=True, text=True, 
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        env=env)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print the output
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:", result.stderr)
        
        success = result.returncode == 0
        
        return {
            'phase': phase_name,
            'success': success,
            'duration': duration,
            'return_code': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
        
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"❌ ERROR running {phase_name} tests: {str(e)}")
        
        return {
            'phase': phase_name,
            'success': False,
            'duration': duration,
            'return_code': -1,
            'stdout': '',
            'stderr': str(e)
        }

def print_summary_report(results):
    """Print comprehensive summary report"""
    print(f"\n{'='*80}")
    print("📊 COMPREHENSIVE QA TEST SUMMARY REPORT")
    print(f"{'='*80}")
    print(f"Test Run Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total Phases Tested: {len(results)}")
    
    total_duration = sum(result['duration'] for result in results)
    passed_phases = sum(1 for result in results if result['success'])
    failed_phases = len(results) - passed_phases
    
    print(f"Total Test Duration: {total_duration:.2f} seconds")
    print(f"Phases Passed: {passed_phases}")
    print(f"Phases Failed: {failed_phases}")
    print(f"Success Rate: {(passed_phases/len(results))*100:.1f}%")
    
    print(f"\n{'='*80}")
    print("PHASE-BY-PHASE RESULTS")
    print(f"{'='*80}")
    
    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"{status} | {result['phase']:<20} | {result['duration']:.2f}s | Return Code: {result['return_code']}")
    
    if failed_phases > 0:
        print(f"\n{'='*80}")
        print("❌ FAILED PHASES DETAILS")
        print(f"{'='*80}")
        
        for result in results:
            if not result['success']:
                print(f"\n🔍 {result['phase']} FAILURE DETAILS:")
                print(f"Return Code: {result['return_code']}")
                if result['stderr']:
                    print(f"Error Output: {result['stderr']}")
                print("-" * 40)
    
    print(f"\n{'='*80}")
    print("🎯 RECOMMENDATIONS")
    print(f"{'='*80}")
    
    if passed_phases == len(results):
        print("🎉 ALL PHASES PASSED! The platform is ready for production.")
        print("✅ All core functionality is working correctly.")
        print("✅ Authentication and authorization are secure.")
        print("✅ Dashboard APIs are functioning properly.")
        print("✅ Role-based access control is implemented correctly.")
    else:
        print(f"⚠️  {failed_phases} phase(s) failed. Review the following:")
        
        for result in results:
            if not result['success']:
                if 'Phase 1' in result['phase']:
                    print("🔧 Phase 1 Issues: Check core models, business rules, and database setup")
                elif 'Phase 2' in result['phase']:
                    print("🔐 Phase 2 Issues: Check authentication endpoints and JWT configuration")
                elif 'Phase 3' in result['phase']:
                    print("📊 Phase 3 Issues: Check analytics models and dashboard APIs")
        
        print("\n💡 Suggested Actions:")
        print("1. Review error logs above for specific failure details")
        print("2. Ensure Django server is running on port 8000")
        print("3. Ensure React server is running on port 3000")
        print("4. Check database migrations are applied")
        print("5. Verify all dependencies are installed")

def main():
    """Main test runner function"""
    print("🚀 AI Performance Review Platform - Comprehensive QA Test Suite")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Define test scripts
    test_scripts = [
        ('phase1_tests.py', 'Phase 1: Foundation & Business Rules'),
        ('phase2_tests.py', 'Phase 2: Authentication & Role-Based Access'),
        ('phase3_tests.py', 'Phase 3: Navigation & Dashboard Structure')
    ]
    
    results = []
    
    # Check if we're in the right directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Run each test script
    for script_name, phase_name in test_scripts:
        script_path = os.path.join(current_dir, script_name)
        
        if os.path.exists(script_path):
            result = run_test_script(script_path, phase_name)
            results.append(result)
        else:
            print(f"❌ Test script not found: {script_path}")
            results.append({
                'phase': phase_name,
                'success': False,
                'duration': 0,
                'return_code': -1,
                'stdout': '',
                'stderr': f'Test script not found: {script_name}'
            })
    
    # Print comprehensive summary
    print_summary_report(results)
    
    # Return appropriate exit code
    all_passed = all(result['success'] for result in results)
    
    if all_passed:
        print(f"\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        return 0
    else:
        print(f"\n❌ SOME TESTS FAILED - Review the report above")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 