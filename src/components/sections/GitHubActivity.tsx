import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitCommit, Calendar, GitBranch } from "lucide-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { Card } from "../ui/Card";
import { siteConfig } from "../../data/siteConfig";

interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
  repo: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

export const GitHubActivity: React.FC = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const username = siteConfig.githubUsername;
  const [calendarSrc, setCalendarSrc] = useState(
    `https://ghchart.rshah.org/10b981/${username}`
  );
  const [contributionCount, setContributionCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const username = siteConfig.githubUsername;
        
        // Fetch user's recent events
        const eventsResponse = await fetch(
          `https://api.github.com/users/${username}/events?per_page=100`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!eventsResponse.ok) {
          if (eventsResponse.status === 403) {
            setError("GitHub API rate limit reached. Please try again later.");
          } else if (eventsResponse.status === 404) {
            setError("GitHub user not found. Please check your username in settings.");
          } else {
            setError("Unable to fetch GitHub activity at this time.");
          }
          setLoading(false);
          return;
        }

        const events = await eventsResponse.json();
        
        if (!Array.isArray(events)) {
          setError("Unable to load commits.");
          setLoading(false);
          return;
        }
        
        // Filter push events and extract commits (top 3)
        const recentCommits: Commit[] = [];
        
        for (const event of events) {
          if (event.type === "PushEvent" && event.payload?.commits) {
            for (const commit of event.payload.commits) {
              if (recentCommits.length < 3) {
                recentCommits.push({
                  sha: commit.sha.substring(0, 7),
                  message: commit.message.split('\n')[0],
                  date: event.created_at,
                  author: event.actor?.login || username,
                  repo: event.repo?.name || 'Unknown',
                });
              } else {
                break;
              }
            }
          }
          if (recentCommits.length >= 3) break;
        }

        
        if (recentCommits.length === 0) {
          setError("No recent commits found. Push some code to see activity here!");
        } else {
          setCommits(recentCommits);
        }
        
        setLoading(false);
        
      } catch (err: any) {
        // Error occurred while fetching commits
        setError("Unable to load GitHub activity.");
        setLoading(false);
      }
    };

    fetchCommits();
    
    // Fetch contribution count
    const fetchContributionCount = async () => {
      try {
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        if (response.ok) {
          const data = await response.json();
          const total = data.total?.['last'];
          if (total) setContributionCount(total);
        }
      } catch (err) {
        // Could not fetch contribution count
      }
    };
    
    fetchContributionCount();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchCommits, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SectionWrapper id="github-activity">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="text-green-400" size={28} />
          <h2 className="heading-2">Recent GitHub Activity</h2>
        </div>
        <p className="text-text-secondary text-lg">
          My latest contributions and commits
        </p>

        {/* Contributions calendar with dark theme styling */}
        {showCalendar && (
          <Card className="mt-8 p-6 bg-dark-900 backdrop-blur-sm border-dark-700">
            <a 
              href={`https://github.com/${username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex flex-col">
                {/* Calendar Image - Scrollable on mobile */}
                <div className="bg-dark-950 p-4 rounded-lg overflow-x-auto scrollbar-thin scrollbar-thumb-green-400/50 scrollbar-track-dark-800/30 hover:scrollbar-thumb-green-400/70">
                  <style>{`
                    .scrollbar-thin::-webkit-scrollbar {
                      height: 8px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-track {
                      background: rgba(30, 30, 30, 0.3);
                      border-radius: 4px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                      background: rgba(74, 222, 128, 0.5);
                      border-radius: 4px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                      background: rgba(74, 222, 128, 0.7);
                      box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
                    }
                  `}</style>
                  <img
                    src={calendarSrc}
                    alt={`${username} GitHub contributions`}
                    className="rounded min-w-[700px] md:w-full md:min-w-0"
                    style={{ 
                      filter: 'brightness(0.9) contrast(1.2) invert(0.95) hue-rotate(180deg)',
                      imageRendering: 'crisp-edges'
                    }}
                    onError={() => {
                      setShowCalendar(false);
                    }}
                  />
                </div>
                
                {/* Bottom section: Contribution count + Legend */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                  {/* Left: Contribution count */}
                  <div className="flex items-center gap-2 text-text-secondary">
                    {contributionCount !== null ? (
                      <>
                        <span className="text-lg font-bold text-white">
                          {contributionCount.toLocaleString()}
                        </span>
                        <span>contributions in the last year</span>
                      </>
                    ) : (
                      <span>View full contribution history on GitHub</span>
                    )}
                  </div>
                  
                  {/* Right: Less to More legend */}
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-dark-800"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-400/30"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-400/60"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-400/80"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </a>
          </Card>
        )}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <GitCommit className="text-green-400" size={32} />
          </motion.div>
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary">{error}</p>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {commits.length > 0 ? (
            commits.map((commit, index) => (
              <motion.div key={`${commit.sha}-${index}`} variants={itemVariants}>
                <Card hoverable className="group">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-400/10 rounded-lg group-hover:bg-green-400/20 transition-smooth">
                      <GitCommit className="text-green-400" size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium mb-1 truncate">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="font-mono text-green-400">{commit.sha}</span>
                        <span className="truncate">{commit.repo}</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(commit.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="text-center py-12">
              <p className="text-text-secondary">No recent commits found</p>
            </Card>
          )}
        </motion.div>
      )}
    </SectionWrapper>
  );
};
