import { Hono } from "hono";
import { type AppEnv } from "../types";
import { updateWpPostContent } from "../lib/wordpressClient";

const app = new Hono<AppEnv>();

// One-time admin operation - remove this after use
// In production, add back session auth via middleware

const WP_BASE = "https://intelligence.remodeleriq.com/wp-json/wp/v2";

function basicAuth(user: string, pass: string): string {
  return "Basic " + btoa(`${user}:${pass}`);
}

const heroSection = `<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"},"style":{"spacing":{"padding":"60px 40px"},"color":{"background":"#10b981"}}} -->
<div class="wp-block-group" style="background-color:#10b981;padding:60px 40px"><!-- wp:group {"layout":{"type":"constrained","contentSize":"700px"},"style":{"spacing":{"blockGap":"20px"}}} -->
<div class="wp-block-group"><!-- wp:heading {"level":1,"style":{"typography":{"fontSize":"2.5rem","fontStyle":"normal","fontWeight":"700"},"spacing":{"margin":{"bottom":"20px"}},"color":{"text":"#ffffff"}}} -->
<h1 class="wp-block-heading" style="color:#ffffff;font-size:2.5rem;font-weight:700;margin-bottom:20px">Stop Guessing. Snap a Photo. Get a Real Number.</h1>
<!-- /wp:heading --><!-- wp:paragraph {"style":{"typography":{"fontSize":"1.1rem"},"spacing":{"margin":{"bottom":"30px"}}},"textColor":"white"} -->
<p class="has-white-color has-text-color" style="font-size:1.1rem;margin-bottom:30px">Skip the calculator. The RemodelerIQ Visualizer estimates your kitchen, bathroom, or basement in seconds—using real 2026 costs for your region.</p>
<!-- /wp:paragraph --><!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"white","textColor":"#059669","style":{"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-background-color has-text-color" style="color:#059669;font-weight:600" href="https://remodeleriq.com/visualizer/">Estimate Your Project</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`;

app.post("/", async (c) => {
  try {
    const env = c.env as unknown as Record<string, unknown>;
    const user = env.WORDPRESS_USER_GUSTAVO as string;
    const pass = env.WORDPRESS_PASS_GUSTAVO as string;

    if (!user || !pass) {
      return c.json({ error: "WordPress credentials not configured" }, 500);
    }

    // Fetch current post content with auth
    const getRes = await fetch(`${WP_BASE}/posts/2462?context=edit`, {
      headers: {
        Authorization: basicAuth(user, pass),
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!getRes.ok) {
      return c.json(
        { error: `Failed to fetch post: ${getRes.status}` },
        500
      );
    }

    const post = (await getRes.json()) as { content?: { raw?: string } };
    const currentContent = post.content?.raw || "";

    // Check if hero already exists
    if (currentContent.includes("Stop Guessing. Snap a Photo")) {
      return c.json(
        { message: "Hero section already exists on this post", status: "skipped" },
        200
      );
    }

    // Prepend hero to content
    const newContent = heroSection + "\n\n" + currentContent;

    // Update post with authenticated client
    await updateWpPostContent(c.env as never, "gustavo", 2462, newContent);

    return c.json(
      {
        message: "Hero section added successfully",
        postId: 2462,
        postUrl: "https://intelligence.remodeleriq.com/estimate-remodel-cost-from-a-photo-visualizer/",
      },
      200
    );
  } catch (err) {
    console.error("Error updating visualizer post:", err);
    return c.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
