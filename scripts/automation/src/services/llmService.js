/**
 * LLM Service for Article Improvement
 * 
 * Uses LLM APIs (OpenAI, Anthropic, etc.) to improve article content
 * while avoiding plagiarism and hallucination.
 * 
 * Design Philosophy:
 * - LLM acts as a content assistant, not a content generator
 * - References are used as style/structure guides, not sources to copy
 * - Original factual intent is preserved
 * - All content is rewritten in original language
 * - No citations or references are invented
 * 
 * Anti-Plagiarism Strategy:
 * 1. Explicit instruction to rewrite, not copy
 * 2. Emphasis on original expression of ideas
 * 3. Reference articles used only for style/structure inspiration
 * 4. No verbatim copying allowed
 * 
 * Anti-Hallucination Strategy:
 * 1. No instruction to add citations or references
 * 2. Focus on improving existing content, not adding new facts
 * 3. Explicit instruction to preserve factual intent
 * 4. No instruction to add external links or citations
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { HttpError, ScraperError } from '../utils/errors.js';

/**
 * Constructs the prompt for article improvement
 * 
 * This prompt is designed to:
 * - Use references as style/structure guides only
 * - Encourage original rewriting
 * - Preserve factual content
 * - Avoid plagiarism
 * - Prevent hallucination
 * 
 * @param {string} originalContent - Original article content
 * @param {Array<Object>} referenceArticles - Array of reference articles with title and content
 * @returns {string} Complete prompt for LLM
 */
function buildImprovementPrompt(originalContent, referenceArticles) {
  const referencesText = referenceArticles.map((ref, index) => {
    return `Reference Article ${index + 1}: ${ref.title}\n${ref.content.substring(0, 2000)}...`;
  }).join('\n\n---\n\n');
  
  return `You are a professional content editor helping to improve an article. Your task is to enhance the clarity, structure, and depth of the original article while preserving its factual intent.

ORIGINAL ARTICLE:
${originalContent}

REFERENCE ARTICLES (for style and structure inspiration only):
${referencesText}

INSTRUCTIONS:
1. Rewrite the original article to improve clarity, structure, and informational depth
2. Use the reference articles ONLY as examples of good formatting, structure, and informational richness - DO NOT copy their content
3. Express all ideas in your own original words - never copy text verbatim from the original or references
4. Preserve the factual intent and main points of the original article
5. Enhance the article's organization, flow, and readability
6. Add depth where appropriate, but only expand on ideas already present in the original
7. Write in clear, professional language suitable for a blog audience
8. Do NOT add citations, references, or external links
9. Do NOT invent facts, statistics, or claims not present in the original
10. Do NOT mention the reference articles or cite them in any way
11. Output ONLY the improved article content - no explanations, no markdown formatting, no metadata

IMPORTANT:
- This is a rewrite, not a copy. Every sentence should be in your own words.
- The reference articles are style guides only - do not extract information from them.
- Focus on improving what exists, not adding new information.
- Maintain the article's core message and factual content.

IMPROVED ARTICLE:`;
}

/**
 * Sends request to OpenAI API
 * @param {string} prompt - Complete prompt
 * @param {Object} options - API options
 * @returns {Promise<string>} Generated content
 */
async function callOpenAI(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ScraperError('OPENAI_API_KEY not found in environment variables');
  }
  
  const model = options.model || 'gpt-4-turbo-preview';
  const maxTokens = options.maxTokens || 4000;
  const temperature = options.temperature || 0.7; // Lower temperature = more consistent, less creative
  
  try {
    logger.info('Sending request to OpenAI API...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional content editor. You rewrite articles to improve clarity and structure while preserving factual content. You never copy text verbatim and always express ideas in original language.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        frequency_penalty: 0.3, // Discourage repetition
        presence_penalty: 0.3  // Encourage variety in expression
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout for longer articles
      }
    );
    
    if (!response.data.choices || response.data.choices.length === 0) {
      throw new ScraperError('No response from OpenAI API');
    }
    
    const content = response.data.choices[0].message.content.trim();
    logger.info(`Received ${content.length} characters from OpenAI`);
    
    return content;
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error?.message || error.message;
      throw new HttpError(
        `OpenAI API error: ${errorMsg}`,
        error.response.status,
        error
      );
    }
    
    throw new HttpError(`Failed to call OpenAI API: ${error.message}`, null, error);
  }
}

/**
 * Sends request to Anthropic Claude API
 * @param {string} prompt - Complete prompt
 * @param {Object} options - API options
 * @returns {Promise<string>} Generated content
 */
async function callAnthropic(prompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ScraperError('ANTHROPIC_API_KEY not found in environment variables');
  }
  
  const model = options.model || 'claude-3-opus-20240229';
  const maxTokens = options.maxTokens || 4000;
  
  try {
    logger.info('Sending request to Anthropic API...');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: 'You are a professional content editor. You rewrite articles to improve clarity and structure while preserving factual content. You never copy text verbatim and always express ideas in original language.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    
    if (!response.data.content || response.data.content.length === 0) {
      throw new ScraperError('No response from Anthropic API');
    }
    
    const content = response.data.content[0].text.trim();
    logger.info(`Received ${content.length} characters from Anthropic`);
    
    return content;
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error?.message || error.message;
      throw new HttpError(
        `Anthropic API error: ${errorMsg}`,
        error.response.status,
        error
      );
    }
    
    throw new HttpError(`Failed to call Anthropic API: ${error.message}`, null, error);
  }
}

/**
 * Improves an article using LLM with reference articles as style guides
 * 
 * @param {Object} params - Parameters for article improvement
 * @param {string} params.originalContent - Original article content
 * @param {string} params.originalTitle - Original article title
 * @param {Array<Object>} params.referenceArticles - Array of reference articles
 *   Each should have: { title: string, content: string, url?: string }
 * @param {Object} params.options - Optional LLM configuration
 *   - provider: 'openai' | 'anthropic' (default: from env or 'openai')
 *   - model: Model name (optional)
 *   - maxTokens: Maximum tokens (default: 4000)
 *   - temperature: Temperature setting (default: 0.7)
 * @returns {Promise<Object>} Improved article with metadata
 */
export async function improveArticleWithLLM(params) {
  const { originalContent, originalTitle, referenceArticles, options = {} } = params;
  
  // Validation
  if (!originalContent || typeof originalContent !== 'string' || originalContent.trim().length === 0) {
    throw new ScraperError('originalContent is required and must be a non-empty string');
  }
  
  if (!originalTitle || typeof originalTitle !== 'string' || originalTitle.trim().length === 0) {
    throw new ScraperError('originalTitle is required and must be a non-empty string');
  }
  
  if (!Array.isArray(referenceArticles) || referenceArticles.length === 0) {
    throw new ScraperError('referenceArticles is required and must be a non-empty array');
  }
  
  // Validate reference articles structure
  for (const ref of referenceArticles) {
    if (!ref.title || !ref.content) {
      throw new ScraperError('Each reference article must have title and content');
    }
    if (typeof ref.content !== 'string' || ref.content.trim().length < 100) {
      throw new ScraperError('Reference article content must be at least 100 characters');
    }
  }
  
  logger.info(`Improving article: "${originalTitle}"`);
  logger.info(`Using ${referenceArticles.length} reference article(s) as style guides`);
  
  try {
    // Build prompt
    const prompt = buildImprovementPrompt(originalContent, referenceArticles);
    
    // Determine provider
    const provider = options.provider || process.env.LLM_PROVIDER || 'openai';
    
    // Call appropriate LLM API
    let improvedContent;
    if (provider.toLowerCase() === 'anthropic') {
      improvedContent = await callAnthropic(prompt, options);
    } else {
      improvedContent = await callOpenAI(prompt, options);
    }
    
    // Validate output
    if (!improvedContent || improvedContent.trim().length < 100) {
      throw new ScraperError('LLM returned content that is too short or empty');
    }
    
    // Clean up output (remove any markdown artifacts if present)
    improvedContent = improvedContent
      .replace(/^```[\w]*\n/g, '') // Remove markdown code blocks
      .replace(/\n```$/g, '')
      .trim();
    
    logger.info(`Article improvement complete. Original: ${originalContent.length} chars, Improved: ${improvedContent.length} chars`);
    
    return {
      originalTitle,
      originalContent,
      improvedContent,
      originalLength: originalContent.length,
      improvedLength: improvedContent.length,
      referenceCount: referenceArticles.length,
      provider,
      improvedAt: new Date().toISOString()
    };
    
  } catch (error) {
    if (error instanceof HttpError || error instanceof ScraperError) {
      throw error;
    }
    
    throw new ScraperError(`Failed to improve article: ${error.message}`, error);
  }
}

/**
 * Gets the improvement prompt text (for testing/debugging)
 * @param {string} originalContent - Original article content
 * @param {Array<Object>} referenceArticles - Reference articles
 * @returns {string} Prompt text
 */
export function getImprovementPrompt(originalContent, referenceArticles) {
  return buildImprovementPrompt(originalContent, referenceArticles);
}

