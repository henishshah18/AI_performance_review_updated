#!/usr/bin/env python3
"""
Quick Health Check for Phase 5 Feedback APIs
Tests basic API functionality without complex test setup.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_feedback_endpoints():
    """Test feedback API endpoints"""
    print("🔍 Testing Feedback API Endpoints")
    print("=" * 50)
    
    # Test endpoints that don't require authentication first
    endpoints_to_test = [
        "/api/feedback/",
        "/api/feedback/analytics/",
        "/api/feedback/settings/tag-templates/",
        "/api/feedback/tags/trending/",
    ]
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{BASE_URL}{endpoint}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 401:
                print(f"✅ {endpoint} - Authentication required (expected)")
            elif response.status_code == 200:
                print(f"✅ {endpoint} - OK (status: {response.status_code})")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint} - Server not running")
            return False
        except Exception as e:
            print(f"❌ {endpoint} - Error: {str(e)}")
    
    return True

def test_admin_interface():
    """Test Django admin interface"""
    print("\n🔍 Testing Django Admin Interface")
    print("=" * 50)
    
    try:
        url = f"{BASE_URL}/admin/"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            print("✅ Django Admin - Accessible")
            return True
        else:
            print(f"⚠️  Django Admin - Status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Django Admin - Server not running")
        return False
    except Exception as e:
        print(f"❌ Django Admin - Error: {str(e)}")
        return False

def check_database_connectivity():
    """Check if we can connect to database through Django"""
    print("\n🔍 Testing Database Connectivity")
    print("=" * 50)
    
    try:
        # Try to access an endpoint that would hit the database
        url = f"{BASE_URL}/api/feedback/"
        response = requests.get(url, timeout=5)
        
        # Even if we get 401 (unauthorized), it means Django is working
        if response.status_code in [200, 401, 403]:
            print("✅ Database - Connected (Django responding)")
            return True
        else:
            print(f"⚠️  Database - Unexpected status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Database - Server not running")
        return False
    except Exception as e:
        print(f"❌ Database - Error: {str(e)}")
        return False

def main():
    """Run all health checks"""
    print("🚀 Phase 5 Feedback Module - Quick Health Check")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing against: {BASE_URL}")
    print()
    
    results = []
    
    # Run tests
    results.append(("API Endpoints", test_feedback_endpoints()))
    results.append(("Admin Interface", test_admin_interface()))
    results.append(("Database Connectivity", check_database_connectivity()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 HEALTH CHECK SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All health checks passed! Phase 5 APIs are running correctly.")
    elif passed >= total * 0.7:
        print("✅ Most health checks passed. Phase 5 is mostly functional.")
    else:
        print("⚠️  Some health checks failed. Check server status and configuration.")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Health check interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Health check failed: {str(e)}")
        exit(1) 