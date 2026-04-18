import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async validateMilestone(
    taskDescription: string,
    submissionContent: string,
  ): Promise<{ approved: boolean; reason: string; confidence: number }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert project validator. Compare the proof of work against the task description. 
            Be strict but fair. Respond ONLY in JSON format with fields: "approved" (boolean), "reason" (string), "confidence" (number between 0 and 1).`,
          },
          {
            role: 'user',
            content: `Task Description: ${taskDescription}\nSubmission Proof: ${submissionContent}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('AI returned empty response');

      const result = JSON.parse(content);
      return {
        approved: result.approved,
        reason: result.reason,
        confidence: result.confidence,
      };
    } catch (error) {
      console.error('AI Validation Error:', error);
      return {
        approved: false,
        reason: 'AI validation service unavailable. Manual review required.',
        confidence: 0,
      };
    }
  }

  async resolveDispute(
    taskDescription: string,
    submissionContent: string,
    chatLogs: string,
  ): Promise<{ summary: string; suggestion: 'RELEASE' | 'REFUND' | 'SPLIT' }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an arbitrator for a freelance dispute. Analyze the project details and user communication to suggest a resolution.
            Respond ONLY in JSON format with fields: "summary" (string), "suggestion" ("RELEASE", "REFUND", "SPLIT").`,
          },
          {
            role: 'user',
            content: `Task: ${taskDescription}\nProof: ${submissionContent}\nChat Logs: ${chatLogs}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('AI returned empty response');

      return JSON.parse(content);
    } catch (error) {
      console.error('AI Dispute Error:', error);
      return {
        summary: 'Error processing dispute via AI.',
        suggestion: 'SPLIT',
      };
    }
  }
}
