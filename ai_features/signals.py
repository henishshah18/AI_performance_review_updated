import django.dispatch

# Signal sent when a new piece of content that can be analyzed is created.
# Providing args: "instance"
new_content_for_analysis = django.dispatch.Signal() 