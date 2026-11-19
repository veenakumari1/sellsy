import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Store, Product

logger = logging.getLogger("storsy.content_generator")

class ContentGeneratorService:
    @staticmethod
    def _call_gemini(prompt: str) -> Optional[str]:
        if not settings.GEMINI_API_KEY or len(settings.GEMINI_API_KEY) < 10:
            return None
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call skipped: {e}")
        return None

    @classmethod
    def generate_content(
        cls,
        db: Session,
        store: Store,
        product_id: str,
        content_type: str = "description",
        tone: str = "friendly"
    ) -> Dict[str, Any]:
        """
        Generates 3 variations of e-commerce marketing content tailored to the product,
        content type, and tone.
        """
        product = db.query(Product).filter(Product.id == product_id, Product.store_id == store.id).first()
        if not product:
            raise ValueError("Product not found")

        prod_title = product.title
        prod_desc = product.description or "Premium artisanal crafted product"
        prod_price = f"Rs {product.price:,.0f}" if product.price else ""
        category_name = product.category.name if product.category else "Lifestyle"

        type_labels = {
            "description": "E-Commerce Product Description",
            "ad_copy": "Facebook & Instagram Paid Ad Copy",
            "social_post": "Social Media Organic Post & Reel Caption"
        }
        type_label = type_labels.get(content_type, "Product Copy")

        # 1. Attempt Gemini Generation
        prompt = (
            f"You are a top-tier e-commerce copywriter specializing in direct-response retail marketing for '{store.name}'.\n"
            f"Product: {prod_title}\n"
            f"Category: {category_name}\n"
            f"Price: {prod_price}\n"
            f"Details: {prod_desc}\n"
            f"Format: {type_label}\n"
            f"Tone: {tone.capitalize()}\n\n"
            f"Produce exactly 3 distinct variations of high-converting copy in valid JSON format:\n"
            f"{{\n"
            f'  "variations": [\n'
            f'    {{\n'
            f'      "id": 1,\n'
            f'      "title": "Variation 1: Hook & Benefit-Driven",\n'
            f'      "headline": "Catchy headline",\n'
            f'      "body": "Persuasive body copy",\n'
            f'      "call_to_action": "Compelling call to action",\n'
            f'      "tags": ["#tag1", "#tag2"]\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": 2,\n'
            f'      "title": "Variation 2: Feature-Focused & Direct",\n'
            f'      "headline": "Clear value-focused headline",\n'
            f'      "body": "Informative copy highlighting craft and utility",\n'
            f'      "call_to_action": "Direct call to action",\n'
            f'      "tags": ["#tag1", "#tag2"]\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": 3,\n'
            f'      "title": "Variation 3: Punchy & Conversational",\n'
            f'      "headline": "Short emotional punch",\n'
            f'      "body": "Breezy storytelling copy",\n'
            f'      "call_to_action": "Snappy call to action",\n'
            f'      "tags": ["#tag1", "#tag2"]\n'
            f'    }}\n'
            f'  ]\n'
            f"}}\n"
            f"Return ONLY the JSON object."
        )

        ai_raw = cls._call_gemini(prompt)
        if ai_raw:
            try:
                clean_json = ai_raw.strip()
                if clean_json.startswith("```"):
                    lines = clean_json.split("\n")
                    clean_json = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                parsed = json.loads(clean_json)
                if "variations" in parsed and len(parsed["variations"]) == 3:
                    for v in parsed["variations"]:
                        full_text = f"{v.get('headline', '')} {v.get('body', '')} {v.get('call_to_action', '')}"
                        v["char_count"] = len(full_text.strip())
                    return {
                        "product_id": product.id,
                        "product_title": prod_title,
                        "content_type": content_type,
                        "tone": tone,
                        "variations": parsed["variations"]
                    }
            except Exception as e:
                logger.warning(f"Failed to parse Gemini content JSON: {e}. Falling back to template generation.")

        # 2. High-Converting Rule-Based Fallback Matrix
        variations = cls._generate_fallback_variations(
            title=prod_title,
            desc=prod_desc,
            price=prod_price,
            category=category_name,
            content_type=content_type,
            tone=tone,
            store_name=store.name
        )

        return {
            "product_id": product.id,
            "product_title": prod_title,
            "content_type": content_type,
            "tone": tone,
            "variations": variations
        }

    @staticmethod
    def _generate_fallback_variations(
        title: str,
        desc: str,
        price: str,
        category: str,
        content_type: str,
        tone: str,
        store_name: str
    ) -> List[Dict[str, Any]]:
        price_str = f" for only {price}" if price else ""

        if content_type == "ad_copy":
            if tone == "urgent":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Limited Release Urgency",
                    "headline": f"Selling Out Fast: The {title}",
                    "body": f"Our artisanal batch of {title} is moving rapidly{price_str}. Engineered for everyday elegance and long-lasting durability, this collection won't be restocked until next month. Secure yours before sizes run out.",
                    "call_to_action": "Shop Now Before Stock Depletes",
                    "tags": ["#LimitedDrop", "#ArtisanCraft", f"#{category.replace(' ', '')}"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Weekend Flash Incentive",
                    "headline": f"Don't Miss Out: 10% Off {title} This Weekend",
                    "body": f"Upgrade your {category.lower()} collection today. Experience the unmatched craftsmanship of our {title}. Free nationwide dispatch on all prepaid orders placed today.",
                    "call_to_action": "Claim Your Discount Code Today",
                    "tags": ["#WeekendDeal", "#SpecialOffer", "#ShopLocal"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Direct Response Scarcity",
                    "headline": f"Final Few Units Left in Stock",
                    "body": f"Over 120+ happy customers have already grabbed their {title}. If you've had your eye on it, now is the time to act before current inventory reaches zero.",
                    "call_to_action": "Order Now – Fast 48h Delivery",
                    "tags": ["#LastCall", "#BestSeller", "#ExpressShipping"]
                }
            elif tone == "premium":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Luxury & Heritage Narrative",
                    "headline": f"Crafted Without Compromise: The {title}",
                    "body": f"Indulge in timeless texture and understated luxury. Every detail of the {title} has been thoughtfully curated for those who appreciate true artisan refinement. Now available exclusively at {store_name}.",
                    "call_to_action": "Explore The Signature Edition",
                    "tags": ["#TimelessLuxury", "#ArtisanMade", "#SignatureStyle"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Elevated Aesthetic",
                    "headline": f"Elegance in Every Stitch and Contour",
                    "body": f"Elevate your daily routine with {title}. Combining organic materials with modern silhouette perfection, it represents the pinnacle of our {category} collection.",
                    "call_to_action": "Discover Exceptional Quality",
                    "tags": ["#ElevatedLiving", "#LuxuryLifestyle", "#CuratedDesign"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: The Connoisseur’s Choice",
                    "headline": f"Redefining Everyday Luxury",
                    "body": f"For the discerning collector: our {title} offers effortless balance between tactile beauty and enduring utility{price_str}. Delivered in signature gift-ready packaging.",
                    "call_to_action": "Acquire Yours Today",
                    "tags": ["#BespokeCraft", "#ModernHeritage", f"#{store_name.replace(' ', '')}"]
                }
            else:  # friendly
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Warm & Conversational",
                    "headline": f"Meet Your New Favorite: The {title}",
                    "body": f"Looking for something special to brighten up your wardrobe or home? Our {title} is finally back in stock! Beautifully designed, wonderfully comfortable, and made to last{price_str}.",
                    "call_to_action": "Tap Below to See Colors & Details",
                    "tags": ["#EverydayFavorites", "#HandmadeGoodness", "#ShopSmall"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Community Love",
                    "headline": f"Why Everyone Is Obsessed With {title}!",
                    "body": f"From the soft texture to the immaculate finish, here is why our community can't stop raving about the {title}. Add that feel-good touch to your cart with zero hassle returns.",
                    "call_to_action": "Join Happy Customers – Shop Now",
                    "tags": ["#CustomerLoved", "#DailyInspo", "#TreatYourself"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Simple & Sincere",
                    "headline": f"Thoughtfully Made for Real Life",
                    "body": f"We believe quality essentials should never be complicated. Our {title} brings authentic artisan craftsmanship straight to your doorstep with love from {store_name}.",
                    "call_to_action": "Get Yours Shipped Today",
                    "tags": ["#FeelGoodShopping", "#HonestQuality", "#SimpleLiving"]
                }

        elif content_type == "social_post":
            if tone == "urgent":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Drop Alert & Countdown",
                    "headline": f"🚨 Restock Alert: {title} is live!",
                    "body": f"You asked, we delivered! The {title} is officially back on shelves, but with limited numbers per design. Link in bio to grab yours before it sells out again! 👇",
                    "call_to_action": "Link in bio to shop now ⏳",
                    "tags": ["#DropAlert", "#Restock", "#MustHave", "#ShopNow"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Reels / TikTok Audio Hook",
                    "headline": "Don't walk, RUN! 🏃‍♀️",
                    "body": f"If you've been waiting for our {title}, this is your official reminder that current inventory is disappearing fast. Treat yourself today before this drop closes!",
                    "call_to_action": "Save & share with your shopping bestie 🛒",
                    "tags": ["#ShoppingSpree", "#TrendingNow", "#ViralFinds"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Limited Bundle Announcement",
                    "headline": "First 20 orders only! ✨",
                    "body": f"Order the {title} today and receive complimentary priority packaging. Once they're gone, they're gone!",
                    "call_to_action": "Tap link in bio to secure yours 🔗",
                    "tags": ["#SpecialDrop", "#ExclusiveAccess", "#DontMissIt"]
                }
            elif tone == "premium":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Minimalist Editorial Mood",
                    "headline": f"The Art of Subtle Sophistication. 🕊️",
                    "body": f"Quiet moments with our {title}. Handcrafted textures, intentional lines, and an enduring presence for modern living. What's your favorite detail?",
                    "call_to_action": "Discover the collection via the link in our bio.",
                    "tags": ["#QuietLuxury", "#CuratedHome", "#DesignInspo", "#ArtisanCraft"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Process & Craft Behind The Scenes",
                    "headline": "Patience. Passion. Perfection. 🤎",
                    "body": f"Behind every single {title} lies hours of dedicated handcrafting and master needlework. Made to be cherished for years, not seasons.",
                    "call_to_action": "Explore craftsmanship at the link in bio.",
                    "tags": ["#SlowCraft", "#MasterArtisan", "#SustainableLuxury"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Texture & Palette Focus",
                    "headline": f"Earthy neutrals, timeless feel. 🌿",
                    "body": f"The {title} styled seamlessly for everyday grace. Designed to blend into your sanctuary while making a quiet statement.",
                    "call_to_action": "Shop the aesthetic via link in bio.",
                    "tags": ["#NeutralAesthetic", "#LuxuryLiving", "#StyleStatement"]
                }
            else:  # friendly
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Cozy Community Post",
                    "headline": f"A little something special for your week! 💛",
                    "body": f"Say hello to our {title}! Whether you're treating yourself or picking out a thoughtful gift for someone you love, this piece is pure joy. Tell us: which color would you choose? 👇",
                    "call_to_action": "Link in bio to browse the collection ✨",
                    "tags": ["#SmallBusinessLove", "#DailyJoy", "#HandmadeWithLove"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Relatable Storytelling",
                    "headline": "Adding this to our forever favorites list. 😍",
                    "body": f"We just unpacked the latest batch of {title} and we couldn't wait to show you! Soft, durable, and so versatile. How would you style it?",
                    "call_to_action": "Double tap if you love this look! ❤️",
                    "tags": ["#StyleInspo", "#CozyVibes", "#ShopSmallBusiness"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Weekend Mood",
                    "headline": f"Weekend plans: relaxing with {title} ☕",
                    "body": f"Slow mornings deserve beautiful things. Grab your favorite chai, kick back, and let us bring {title} straight to your doorstep.",
                    "call_to_action": "Shop relaxed weekends at the link in bio 🌸",
                    "tags": ["#SlowLiving", "#ChaiTime", "#WeekendMood"]
                }

        else:  # description
            if tone == "urgent":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: High-Impact Direct Response",
                    "headline": f"Upgrade Your Standard: The High-Demand {title}",
                    "body": f"Built for those who value both style and resilience, the {title} represents top-tier artisan craft in our {category} line. Featuring reinforced construction and premium materials, it delivers exceptional tactile comfort and reliability. High seasonal demand means remaining inventory is strictly limited.",
                    "call_to_action": "Add to Cart to Secure Your Unit Today",
                    "tags": ["#HighDemand", "#BestInClass", "#GuaranteedQuality"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Problem-Solution Feature Breakdown",
                    "headline": f"The Smarter Everyday Solution",
                    "body": f"Tired of mass-produced alternatives that degrade after a few uses? The {title} is built with hand-finished craftsmanship that resists wear and retains its shape. Perfectly proportioned for daily utility and effortless visual appeal.",
                    "call_to_action": "Order Now – In Stock & Ready to Dispatch",
                    "tags": ["#BuiltToLast", "#EverydayUtility", "#PremiumFinish"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Express Checkout Focus",
                    "headline": f"Top-Rated {category} Essential",
                    "body": f"{desc}. Carefully inspected and packaged to arrive in showroom condition. Experience why over 90% of our customers rate this product 5 stars.",
                    "call_to_action": "Select Your Options & Buy Now",
                    "tags": ["#TopRated", "#VerifiedReview", "#InstantDispatch"]
                }
            elif tone == "premium":
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Luxury Catalog Specification",
                    "headline": f"Artisanal Refinement: {title}",
                    "body": f"An ode to master craftsmanship, the {title} embodies refined luxury. Sourced from choice natural materials and shaped with exquisite precision, each piece carries subtle nuances of handcrafted artistry. Designed to elevate both functional utility and aesthetic distinction.",
                    "call_to_action": "Acquire This Masterpiece",
                    "tags": ["#ArtisanalLuxury", "#SignatureDesign", "#MasterCraft"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Sensory & Material Experience",
                    "headline": "Tactile Elegance For Discerning Tastes",
                    "body": f"From the initial touch, the superior weight and texture of {title} make an unforgettable impression. Impeccably finished seams and organic finishes celebrate traditional artisanal heritage with modern luxury.",
                    "call_to_action": "Experience True Craftsmanship",
                    "tags": ["#SensoryLuxury", "#HeirloomQuality", "#BespokeTouch"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: The Statement Piece",
                    "headline": "A Lasting Investment in Timeless Quality",
                    "body": f"{desc}. Every dimension is balanced to provide comfort, visual harmony, and lifelong durability. Ideal for sophisticated personal use or prestigious gifting.",
                    "call_to_action": "Reserve Your Piece Today",
                    "tags": ["#TimelessInvestment", "#CuratedLuxury", "#PrestigeCollection"]
                }
            else:  # friendly
                v1 = {
                    "id": 1,
                    "title": "Variation 1: Welcoming & Feature-Rich",
                    "headline": f"Everything You Need To Know About The {title}",
                    "body": f"Looking for something that feels as wonderful as it looks? The {title} is made with love and designed for everyday joy. With durable materials and timeless styling, it fits seamlessly into your life{price_str}.",
                    "call_to_action": "Add to Your Bag – Free Exchanges",
                    "tags": ["#EverydayComfort", "#ShopSmall", "#CustomerFavorite"]
                }
                v2 = {
                    "id": 2,
                    "title": "Variation 2: Heartcrafted Story",
                    "headline": f"Crafted with Care, Delivered with Pride",
                    "body": f"{desc}. We handcraft every batch in small runs to ensure each customer receives an exceptional piece. Easy to care for and designed to bring a smile to your everyday routine.",
                    "call_to_action": "Get Yours Today with 1-Click Checkout",
                    "tags": ["#Heartcrafted", "#SmallBatch", "#MadeWithLove"]
                }
                v3 = {
                    "id": 3,
                    "title": "Variation 3: Clear & Honest Utility",
                    "headline": "Your New Everyday Go-To",
                    "body": f"Versatile, comfortable, and beautifully finished. Whether you're refreshing your setup or treating yourself to an artisan upgrade, the {title} won't disappoint.",
                    "call_to_action": "Order Yours Now & Enjoy Fast Shipping",
                    "tags": ["#DailyEssential", "#TrustedQuality", "#CustomerFirst"]
                }

        for v in [v1, v2, v3]:
            full = f"{v['headline']} {v['body']} {v['call_to_action']}"
            v["char_count"] = len(full.strip())

        return [v1, v2, v3]

