from .openai_service import openai_service
from okr.models import Goal
from core.models import User
import logging

logger = logging.getLogger(__name__)

class ReviewGeneratorService:
    def generate_self_assessment_draft(self, user: User) -> str:
        """
        Generates a draft for a user's self-assessment based on their
        completed and in-progress goals.
        """
        goals = Goal.objects.filter(assigned_to=user, status__in=['completed', 'in_progress'])
        if not goals.exists():
            return "No recent goals found to generate a self-assessment from."

        goal_summary = "\n".join([
            f"- Goal: {g.name} (Status: {g.get_status_display()}, Progress: {g.progress}%)"
            for g in goals
        ])

        prompt = f"""
        Based on the following goals and their progress for {user.full_name},
        please write a concise, professional self-assessment draft. The draft
        should highlight achievements from completed goals and reflect on ongoing
        work for in-progress goals.

        Goals:
        {goal_summary}

        Self-Assessment Draft:
        """
        try:
            return openai_service.get_completion(prompt, max_tokens=500, temperature=0.5)
        except Exception as e:
            logger.error(f"Failed to generate self-assessment for {user.email}: {e}")
            return "Error: Could not generate self-assessment draft."

    def generate_peer_review_draft(self, from_user: User, to_user: User, relationship: str) -> str:
        """
        Generates a draft for a peer review.
        'relationship' could be 'collaborated on a project', 'is a mentor', etc.
        """
        prompt = f"""
        User {from_user.full_name} needs to write a peer review for {to_user.full_name}.
        Their relationship is: "{relationship}".

        Please generate a professional, constructive peer review draft. The draft
        should be balanced, providing both positive feedback and areas for
        potential growth. Focus on a collaborative and supportive tone.

        Peer Review Draft:
        """
        try:
            return openai_service.get_completion(prompt, max_tokens=400, temperature=0.6)
        except Exception as e:
            logger.error(f"Failed to generate peer review from {from_user.email} to {to_user.email}: {e}")
            return "Error: Could not generate peer review draft."

review_generator = ReviewGeneratorService() 