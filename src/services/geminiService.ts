/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { BlogIdentity, BlogPost } from "../types";
import { SYSTEM_PROMPT_IDENTITY, SYSTEM_PROMPT_POST, SYSTEM_PROMPT_IMAGE_PROMPTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateBlogIdentity(): Promise<BlogIdentity> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Please generate my blog identity.",
    config: {
      systemInstruction: SYSTEM_PROMPT_IDENTITY,
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "{}") as BlogIdentity;
  } catch (e) {
    console.error("Failed to parse identity JSON", e);
    throw new Error("Could not generate identity.");
  }
}

export async function generateBlogPost(day: number): Promise<BlogPost> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate post for Day ${day}.`,
    config: {
      systemInstruction: SYSTEM_PROMPT_POST.replace("{day}", day.toString()),
      responseMimeType: "application/json",
    },
  });

  try {
    const post = JSON.parse(response.text || "{}") as BlogPost;
    post.day = day;
    return post;
  } catch (e) {
    console.error("Failed to parse post JSON", e);
    throw new Error("Could not generate post.");
  }
}

export async function regenerateImagePrompts(postContent: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Regenerate image prompts for this blog post: ${postContent}`,
    config: {
      systemInstruction: SYSTEM_PROMPT_IMAGE_PROMPTS,
      responseMimeType: "application/json",
    },
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result.imagePrompts || [];
  } catch (e) {
    console.error("Failed to parse image prompts JSON", e);
    throw new Error("Could not regenerate image prompts.");
  }
}
