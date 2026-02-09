/**
 * AUTOMATED BLOG CONTENT GENERATION
 *
 * Uses OpenRouter API with free AI models to generate niche-relevant blog content.
 * Tracks published topics to avoid duplicates.
 *
 * Usage:
 *   npx tsx scripts/blog-automation/generate-blog.ts
 *
 * Environment Variables Required:
 *   OPENROUTER_API_KEY - API key from OpenRouter
 *   SITE_CONFIG - Path to blog-config.json (optional, defaults to ./blog-config.json)
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface SiteConfig {
  siteName: string;
  niche: string;
  dataSource: string;
  targetAudience: string[];
  keyEntities: string[];
  topicTemplates: string[];
  internalLinkPages: string[];
  authorName: string;
  authorBio: string;
  siteUrl: string;
}

interface TopicTracker {
  published: string[];
  lastGenerated: string;
  articleCount: number;
}

// AI Models - Primary with fallbacks (all free tier)
const AI_MODELS = [
  'google/gemini-3-flash-preview',           // User preference - primary
  'deepseek/deepseek-chat-v3-0324:free',     // Fallback 1 - stable free
  'meta-llama/llama-4-maverick:free',        // Fallback 2 - Llama 4
];

// ═══════════════════════════════════════════════════════════════════════════
// OPENROUTER CLIENT
// ═══════════════════════════════════════════════════════════════════════════

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://example.com',
    'X-Title': 'Blog Generator',
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// AI GENERATION WITH FALLBACK
// ═══════════════════════════════════════════════════════════════════════════

async function generateWithFallback(
  messages: { role: 'system' | 'user'; content: string }[],
  maxTokens: number = 4000
): Promise<string> {
  for (const model of AI_MODELS) {
    try {
      console.log(`Trying model: ${model}...`);
      const response = await openrouter.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log(`Success with ${model}`);
        return content;
      }
    } catch (e: any) {
      console.log(`Model ${model} failed: ${e.message}`);
      // Continue to next model
    }
  }
  throw new Error('All AI models failed. Check API key and model availability.');
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateUniqueTopic(
  config: SiteConfig,
  tracker: TopicTracker
): Promise<string> {
  const topicPrompt = `You are a content strategist for a ${config.niche} website called "${config.siteName}".

TARGET AUDIENCE: ${config.targetAudience.join(', ')}
DATA SOURCE: ${config.dataSource}
KEY ENTITIES IN OUR DATA: ${config.keyEntities.join(', ')}

ALREADY PUBLISHED (DO NOT REPEAT ANY OF THESE):
${tracker.published.slice(-30).map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None yet'}

TOPIC TEMPLATES FOR INSPIRATION (adapt these, don't copy exactly):
${config.topicTemplates.map(t => `• ${t}`).join('\n')}

Generate ONE new, unique blog topic that:
1. Is HIGHLY RELEVANT to our ${config.niche} niche
2. Would genuinely interest our target audience
3. Has NOT been written before (check the list above!)
4. Can incorporate our data/entities naturally
5. Is SPECIFIC and actionable (not generic)
6. Would rank well for SEO (think long-tail keywords)
7. EVERGREEN: Do NOT include specific years (like "2026" or "2025") in the title - we want timeless content that doesn't become outdated

Return ONLY the topic title (no explanation, no quotes, no punctuation at end).`;

  const topic = await generateWithFallback([
    { role: 'user', content: topicPrompt }
  ], 100);

  return topic.trim().replace(/^["']|["']$/g, '').replace(/[.!?]$/, '');
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateArticle(
  topic: string,
  config: SiteConfig
): Promise<string> {
  const articlePrompt = `Write a comprehensive, valuable blog article about: "${topic}"

REQUIREMENTS:
- 1000-1500 words (this is IMPORTANT - count carefully)
- Written for: ${config.targetAudience.join(', ')}
- Include practical, actionable advice they can use TODAY
- Reference data/statistics from ${config.dataSource} where relevant
- Include 2-3 natural internal links to: ${config.internalLinkPages.join(', ')}
- Use engaging, conversational tone (not robotic or formal)
- Structure with H2 headings, bullet points, clear paragraphs
- Include a compelling introduction that hooks the reader
- End with actionable takeaways or next steps

FORMAT AS MARKDOWN WITH FRONTMATTER:
---
title: "${topic}"
slug: "[create-url-friendly-slug]"
author: "${config.authorName}"
authorBio: "${config.authorBio}"
publishedAt: "${new Date().toISOString().split('T')[0]}"
updatedAt: "${new Date().toISOString().split('T')[0]}"
excerpt: "[Write a 150-160 character compelling summary]"
category: "[Choose most relevant category]"
tags: ["tag1", "tag2", "tag3"]
---

## [First H2 Heading]

[Content...]

## [Second H2 Heading]

[Content with bullet points...]

## [Third H2 Heading]

[More content...]

## Key Takeaways

- [Actionable takeaway 1]
- [Actionable takeaway 2]
- [Actionable takeaway 3]

---

*Looking for more insights? [Check out our data](/search) to explore ${config.niche} information for yourself.*`;

  const article = await generateWithFallback([
    {
      role: 'system',
      content: `You are an expert content writer who creates valuable, well-researched articles for the ${config.niche} industry. Your writing is engaging, informative, and optimized for both readers and SEO. You always write at least 1000 words. IMPORTANT: Write EVERGREEN content - avoid mentioning specific years (like "2026", "this year", "in 2026") in the content. Instead use phrases like "currently", "today", "recent data", "latest statistics". This ensures the article stays relevant and doesn't become outdated.`
    },
    { role: 'user', content: articlePrompt }
  ], 4000);

  return article;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 Blog Generation Starting...\n');

  // Load configuration
  const configPath = process.env.SITE_CONFIG || './blog-config.json';
  if (!fs.existsSync(configPath)) {
    console.error(`ERROR: Config file not found at ${configPath}`);
    console.log('\nCreate a blog-config.json file. See blog-config.template.json for format.');
    process.exit(1);
  }

  const config: SiteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`📋 Site: ${config.siteName}`);
  console.log(`📋 Niche: ${config.niche}\n`);

  // Load or create topic tracker
  const trackerPath = './content/blog/topics.json';
  const trackerDir = path.dirname(trackerPath);
  if (!fs.existsSync(trackerDir)) {
    fs.mkdirSync(trackerDir, { recursive: true });
  }

  let tracker: TopicTracker = { published: [], lastGenerated: '', articleCount: 0 };
  if (fs.existsSync(trackerPath)) {
    tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
  }

  console.log(`📊 Previously published: ${tracker.published.length} articles\n`);

  // Generate unique topic
  console.log('🎯 Generating unique topic...');
  const topic = await generateUniqueTopic(config, tracker);
  console.log(`✅ Topic: ${topic}\n`);

  // Generate full article
  console.log('✍️ Generating article content...');
  const article = await generateArticle(topic, config);
  console.log('✅ Article generated!\n');

  // Save article
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const articlePath = `./content/blog/${slug}.mdx`;
  fs.writeFileSync(articlePath, article);
  console.log(`💾 Saved to: ${articlePath}\n`);

  // Update tracker
  tracker.published.push(topic);
  tracker.lastGenerated = new Date().toISOString();
  tracker.articleCount++;
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));

  // Word count estimate
  const wordCount = article.split(/\s+/).length;
  console.log(`📝 Approximate word count: ${wordCount}`);
  console.log(`📈 Total articles generated: ${tracker.articleCount}`);
  console.log('\n✅ Blog generation complete!');
}

// Run
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
