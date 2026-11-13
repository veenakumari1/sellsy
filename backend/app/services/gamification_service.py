import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import (
    User, Store, UserGamification, AchievementDefinition,
    UserAchievement, GamificationActivity, Notification
)
from app.schemas import (
    GamificationOverviewOut, AchievementOut, GamificationActivityOut,
    LeaderboardUserOut
)
from app.core.websocket_manager import ws_manager

DEFAULT_ACHIEVEMENTS = [
    {
        "key": "store_starter",
        "title": "Store Starter",
        "description": "Successfully connect your e-commerce storefront and ingest store catalog.",
        "category": "onboarding",
        "icon_name": "store",
        "points_reward": 100,
        "target_progress": 1
    },
    {
        "key": "data_explorer",
        "title": "Data Explorer",
        "description": "Analyze period-over-period revenue velocity and KPI benchmarks.",
        "category": "analytics",
        "icon_name": "trending-up",
        "points_reward": 50,
        "target_progress": 1
    },
    {
        "key": "product_expert",
        "title": "Product Expert",
        "description": "Review product intelligence and audit SKU sales velocity margins.",
        "category": "intelligence",
        "icon_name": "package",
        "points_reward": 50,
        "target_progress": 1
    },
    {
        "key": "growth_planner",
        "title": "Growth Planner",
        "description": "Complete a recommended business growth task from AI Marketing Advisor.",
        "category": "growth",
        "icon_name": "target",
        "points_reward": 75,
        "target_progress": 1
    },
    {
        "key": "ai_explorer",
        "title": "AI Explorer",
        "description": "Consult Sellsy Multi-Agent Assistant for autonomous diagnostic insights.",
        "category": "ai",
        "icon_name": "bot",
        "points_reward": 30,
        "target_progress": 1
    },
    {
        "key": "streak_master",
        "title": "Streak Master",
        "description": "Maintain consistent store intelligence activity across consecutive days.",
        "category": "retention",
        "icon_name": "flame",
        "points_reward": 100,
        "target_progress": 3
    }
]

LEVEL_THRESHOLDS = [
    (1, "Commerce Novice", 0, 100),
    (2, "Data Scout", 100, 250),
    (3, "Growth Pioneer", 250, 500),
    (4, "Commerce Strategist", 500, 1000),
    (5, "E-Commerce Master", 1000, 2500)
]

def calculate_level_info(points: int):
    for lvl, title, min_pts, max_pts in LEVEL_THRESHOLDS:
        if points < max_pts or lvl == 5:
            current_level_min = min_pts
            next_level_points = max_pts
            span = max(1, next_level_points - current_level_min)
            progress = min(100.0, round(((points - current_level_min) / span) * 100, 1))
            points_to_next = max(0, next_level_points - points)
            return lvl, title, points_to_next, next_level_points, progress
    return 5, "E-Commerce Master", 0, 2500, 100.0

class GamificationService:
    @staticmethod
    def ensure_definitions(db: Session):
        for ach in DEFAULT_ACHIEVEMENTS:
            existing = db.query(AchievementDefinition).filter(AchievementDefinition.key == ach["key"]).first()
            if not existing:
                ad = AchievementDefinition(
                    key=ach["key"],
                    title=ach["title"],
                    description=ach["description"],
                    category=ach["category"],
                    icon_name=ach["icon_name"],
                    points_reward=ach["points_reward"],
                    target_progress=ach["target_progress"]
                )
                db.add(ad)
        db.commit()

    @staticmethod
    def get_or_create_user_gamification(db: Session, user_id: str, store_id: str = None) -> UserGamification:
        GamificationService.ensure_definitions(db)
        ug = db.query(UserGamification).filter(UserGamification.user_id == user_id).first()
        if not ug:
            ug = UserGamification(
                user_id=user_id,
                store_id=store_id,
                total_points=150,  # Base initial points for store registration
                level=2,
                rank_title="Data Scout",
                streak_days=3
            )
            db.add(ug)
            db.flush()

            # Unlock initial achievements for user
            starter = db.query(AchievementDefinition).filter(AchievementDefinition.key == "store_starter").first()
            if starter:
                db.add(UserAchievement(
                    user_id=user_id,
                    achievement_id=starter.id,
                    is_unlocked=True,
                    current_progress=1,
                    unlocked_at=datetime.now(timezone.utc)
                ))
            explorer = db.query(AchievementDefinition).filter(AchievementDefinition.key == "data_explorer").first()
            if explorer:
                db.add(UserAchievement(
                    user_id=user_id,
                    achievement_id=explorer.id,
                    is_unlocked=True,
                    current_progress=1,
                    unlocked_at=datetime.now(timezone.utc)
                ))

            # Initial activities
            db.add(GamificationActivity(
                user_id=user_id,
                activity_type="store_connected",
                points_earned=100,
                description="Connected Aura Living Essentials store catalog"
            ))
            db.add(GamificationActivity(
                user_id=user_id,
                activity_type="data_explorer",
                points_earned=50,
                description="Explored executive sales analytics and revenue velocity"
            ))
            db.commit()
            db.refresh(ug)

        return ug

    @staticmethod
    def award_points(
        db: Session,
        user_id: str,
        activity_type: str,
        points: int,
        description: str,
        store_id: str = None
    ) -> UserGamification:
        ug = GamificationService.get_or_create_user_gamification(db, user_id, store_id)
        ug.total_points += points

        # Update Level and Rank
        lvl, title, points_to_next, next_pts, prog = calculate_level_info(ug.total_points)
        ug.level = lvl
        ug.rank_title = title
        ug.last_active_at = datetime.now(timezone.utc)

        activity = GamificationActivity(
            user_id=user_id,
            activity_type=activity_type,
            points_earned=points,
            description=description
        )
        db.add(activity)
        db.commit()
        db.refresh(ug)

        # Broadcast via WebSocket if store_id provided
        if store_id:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(ws_manager.broadcast_to_store(store_id, {
                        "type": "POINTS_EARNED",
                        "data": {
                            "points": points,
                            "description": description,
                            "total_points": ug.total_points,
                            "level": ug.level,
                            "rank_title": ug.rank_title
                        }
                    }))
            except Exception:
                pass

        return ug

    @staticmethod
    def unlock_achievement(
        db: Session,
        user_id: str,
        achievement_key: str,
        store_id: str = None
    ) -> Optional[UserAchievement]:
        definition = db.query(AchievementDefinition).filter(AchievementDefinition.key == achievement_key).first()
        if not definition:
            return None

        ua = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == definition.id
        ).first()

        if not ua:
            ua = UserAchievement(
                user_id=user_id,
                achievement_id=definition.id,
                is_unlocked=True,
                current_progress=definition.target_progress,
                unlocked_at=datetime.now(timezone.utc)
            )
            db.add(ua)
            # Award points for achievement
            GamificationService.award_points(
                db, user_id, f"achievement_{achievement_key}",
                definition.points_reward,
                f"Unlocked Achievement: {definition.title}",
                store_id=store_id
            )
            db.commit()
            db.refresh(ua)

            # Broadcast achievement unlock
            if store_id:
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.create_task(ws_manager.broadcast_to_store(store_id, {
                            "type": "ACHIEVEMENT_UNLOCKED",
                            "data": {
                                "title": definition.title,
                                "description": definition.description,
                                "points": definition.points_reward,
                                "icon": definition.icon_name
                            }
                        }))
                except Exception:
                    pass

        elif not ua.is_unlocked:
            ua.is_unlocked = True
            ua.current_progress = definition.target_progress
            ua.unlocked_at = datetime.now(timezone.utc)
            GamificationService.award_points(
                db, user_id, f"achievement_{achievement_key}",
                definition.points_reward,
                f"Unlocked Achievement: {definition.title}",
                store_id=store_id
            )
            db.commit()
            db.refresh(ua)

        return ua

    @staticmethod
    def get_overview(db: Session, user_id: str, store_id: str = None) -> GamificationOverviewOut:
        ug = GamificationService.get_or_create_user_gamification(db, user_id, store_id)
        definitions = db.query(AchievementDefinition).all()
        user_achievements_map = {
            ua.achievement_id: ua
            for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        }

        ach_list: List[AchievementOut] = []
        completed_count = 0

        for ad in definitions:
            ua = user_achievements_map.get(ad.id)
            is_unlocked = ua.is_unlocked if ua else False
            prog = ua.current_progress if ua else 0
            unlocked_at = ua.unlocked_at if ua else None
            if is_unlocked:
                completed_count += 1

            ach_list.append(AchievementOut(
                id=ad.id,
                key=ad.key,
                title=ad.title,
                description=ad.description,
                category=ad.category,
                icon_name=ad.icon_name,
                points_reward=ad.points_reward,
                is_unlocked=is_unlocked,
                current_progress=prog,
                target_progress=ad.target_progress,
                unlocked_at=unlocked_at
            ))

        lvl, title, points_to_next, next_pts, prog_pct = calculate_level_info(ug.total_points)

        recent_acts = db.query(GamificationActivity).filter(
            GamificationActivity.user_id == user_id
        ).order_by(GamificationActivity.created_at.desc()).limit(8).all()

        return GamificationOverviewOut(
            total_points=ug.total_points,
            level=lvl,
            rank_title=title,
            streak_days=ug.streak_days,
            points_to_next_level=points_to_next,
            next_level_points=next_pts,
            level_progress_pct=prog_pct,
            completed_achievements_count=completed_count,
            total_achievements_count=len(definitions),
            achievements=ach_list,
            recent_activities=[GamificationActivityOut.model_validate(a) for a in recent_acts]
        )

    @staticmethod
    def get_leaderboard(db: Session, current_user_id: str, store_name: str = "Aura Living Essentials") -> List[LeaderboardUserOut]:
        ug = GamificationService.get_or_create_user_gamification(db, current_user_id)

        # Benchmark leader merchants
        static_peers = [
            {"name": "Elena Rostova", "store": "Nordic Haven Studio", "points": 840, "level": 4, "rank_title": "Commerce Strategist", "badges": 5},
            {"name": "Marcus Vance", "store": "Solstice Botanicals", "points": 620, "level": 4, "rank_title": "Commerce Strategist", "badges": 4},
            {"name": "Liam Chen", "store": "Velvet & Vine Co.", "points": 380, "level": 3, "rank_title": "Growth Pioneer", "badges": 3},
            {"name": "Chloe Bennett", "store": "Apex Fitness Gear", "points": 290, "level": 3, "rank_title": "Growth Pioneer", "badges": 3},
            {"name": "Devon Miller", "store": "Artisan Craftworks", "points": 180, "level": 2, "rank_title": "Data Scout", "badges": 2},
        ]

        # Count badges for current user
        user_badge_count = db.query(UserAchievement).filter(
            UserAchievement.user_id == current_user_id,
            UserAchievement.is_unlocked == True
        ).count()

        current_entry = {
            "user_id": current_user_id,
            "name": "Alex Mercer (You)",
            "store": store_name,
            "points": ug.total_points,
            "level": ug.level,
            "rank_title": ug.rank_title,
            "badges": user_badge_count,
            "is_current_user": True
        }

        all_entries = [current_entry]
        for p in static_peers:
            all_entries.append({
                "user_id": f"peer_{p['name'].replace(' ', '_').lower()}",
                "name": p["name"],
                "store": p["store"],
                "points": p["points"],
                "level": p["level"],
                "rank_title": p["rank_title"],
                "badges": p["badges"],
                "is_current_user": False
            })

        # Sort by points descending
        all_entries.sort(key=lambda x: x["points"], reverse=True)

        board: List[LeaderboardUserOut] = []
        for idx, entry in enumerate(all_entries):
            board.append(LeaderboardUserOut(
                rank=idx + 1,
                user_id=entry["user_id"],
                name=entry["name"],
                store_name=entry["store"],
                points=entry["points"],
                level=entry["level"],
                rank_title=entry["rank_title"],
                badge_count=entry["badges"],
                is_current_user=entry["is_current_user"]
            ))

        return board

