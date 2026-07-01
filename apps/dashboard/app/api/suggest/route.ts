import { NextRequest, NextResponse } from 'next/server';

const commonHealthTopics = [
  'Knee pain relief exercises',
  'How to improve balance for seniors',
  'Best foods for arthritis',
  'Heart healthy diet tips',
  'Fall prevention strategies',
  'Chronic pain management techniques',
  'Mental health for older adults',
  'Joint pain causes and treatments',
  'Physical therapy exercises for mobility',
  'Nutrition for bone health',
];

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword || keyword.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const lowerKeyword = keyword.toLowerCase();
    const suggestions = commonHealthTopics.filter(topic => 
      topic.toLowerCase().includes(lowerKeyword)
    ).slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
