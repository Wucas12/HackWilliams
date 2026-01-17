import { StudyResource } from '@/types/syllabus';

export async function getStudyMaterials(topic: string): Promise<StudyResource[]> {
  const resources: StudyResource[] = [];
  
  try {
    // Using Tavily API for search
    if (process.env.TAVILY_API_KEY) {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${topic} tutorial study guide cheat sheet`,
          search_depth: 'advanced',
          max_results: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        
        // Filter for YouTube videos and educational resources
        let videoCount = 0;
        let articleCount = 0;

        for (const result of results) {
          if (videoCount < 2 && (result.url.includes('youtube.com') || result.url.includes('youtu.be'))) {
            resources.push({
              title: result.title || topic + ' Tutorial',
              url: result.url,
              type: 'video',
            });
            videoCount++;
          } else if (articleCount < 1 && !result.url.includes('youtube.com') && !result.url.includes('youtu.be')) {
            resources.push({
              title: result.title || topic + ' Study Guide',
              url: result.url,
              type: 'article',
            });
            articleCount++;
          }

          if (resources.length >= 3) break;
        }
      }
    } else {
      // Fallback: Use Perplexity-style search via OpenAI or return empty
      console.warn('TAVILY_API_KEY not set, skipping study materials search');
    }
  } catch (error) {
    console.error('Error fetching study materials:', error);
  }

  return resources;
}
