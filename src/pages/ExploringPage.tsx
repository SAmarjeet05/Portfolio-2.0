import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionWrapper } from '../components/layout/SectionWrapper';
import { Zap, TrendingUp } from 'lucide-react';

interface ExploringItem {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  order: number;
  updatedAt: string;
}

export const ExploringPage = () => {
  const [items, setItems] = useState<ExploringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/exploring');
        const data = await response.json();
        
        if (data.success) {
          // Sort items by order from highest to lowest
          const sortedItems = data.data.sort((a: ExploringItem, b: ExploringItem) => b.order - a.order);
          setItems(sortedItems);
          
          // Find the most recent update date
          if (sortedItems.length > 0) {
            const mostRecent = sortedItems.reduce((latest: ExploringItem, item: ExploringItem) => {
              const itemDate = item.updatedAt ? new Date(item.updatedAt) : new Date(0);
              const latestDate = latest.updatedAt ? new Date(latest.updatedAt) : new Date(0);
              return itemDate > latestDate ? item : latest;
            });
            
            if (mostRecent.updatedAt) {
              const date = new Date(mostRecent.updatedAt);
              if (!isNaN(date.getTime())) {
                setLastUpdated(date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }));
              } else {
                // Fallback to current date if invalid
                setLastUpdated(new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }));
              }
            } else {
              // No updatedAt, use current date
              setLastUpdated(new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exploring items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <SectionWrapper>
        <div className="container px-6 mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper>
      <div className="container px-6 mx-auto">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Currently Exploring', path: '/exploring' }]} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r">
            Currently Exploring
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl">
            Topics, ideas, and systems I'm actively learning and refining.
          </p>
        </motion.div>

        {items.length === 0 ? (
          <div className="glass-effect p-12 rounded-xl border-2 border-dark-700 text-center ">
            <p className="text-text-secondary text-lg">
              No areas of exploration at the moment.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-16"
          >
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12 p-6 glass-effect rounded-xl border-2 border-accent-primary/30 bg-gradient-to-r from-accent-primary/10 to-transparent"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-accent-primary" size={24} />
                  <h3 className="text-lg font-semibold">Learning Journey</h3>
                </div>
                <span className="text-sm font-mono bg-accent-primary/20 px-3 py-1 rounded-full text-accent-primary">
                  {items.length} active path{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-accent-primary via-accent-light to-accent-primary rounded-full"
                />
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line connecting all items */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary via-accent-primary/50 to-transparent rounded-full" />

              {/* Items */}
              <div className="space-y-8">
                {items.map((item, index) => {
                  const isFirst = index === 0;
                  const progressPercent = ((index + 1) / items.length) * 100;
                  const gradientColor = isFirst 
                    ? 'from-accent-primary to-accent-light'
                    : `from-accent-primary/70 to-accent-light/70`;

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative pl-24"
                    >
                      {/* Timeline Node */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 + 0.1 }}
                        className="absolute left-0 top-2 w-16 h-16 flex items-center justify-center"
                      >
                        <div className={`
                          w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold
                          ${isFirst 
                            ? 'bg-gradient-to-br from-accent-primary to-accent-light text-dark-950 shadow-lg shadow-accent-primary/50' 
                            : 'bg-gradient-to-br from-dark-700 to-dark-800 text-accent-primary border-2 border-accent-primary/50'
                          }
                          transition-all duration-300 hover:shadow-lg hover:shadow-accent-primary/30
                        `}>
                          {items.length - index}
                        </div>
                        {isFirst && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-accent-primary/20"
                          />
                        )}
                      </motion.div>

                      {/* Content Card */}
                      <motion.div
                        whileHover={{ x: 8, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className={`
                          glass-effect p-6 rounded-xl border-2 transition-all duration-300
                          ${isFirst
                            ? 'border-accent-primary/60 bg-gradient-to-r from-accent-primary/10 to-transparent shadow-lg shadow-accent-primary/20'
                            : 'border-dark-700 hover:border-accent-primary/40'
                          }
                        `}
                      >
                        {/* Header with badge */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="text-xl font-semibold text-white">
                                {item.title}
                              </h2>
                              {isFirst && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-accent-primary/20 rounded-full">
                                  <Zap size={12} className="text-accent-primary" />
                                  <span className="text-xs font-semibold text-accent-primary">Currently Active</span>
                                </div>
                              )}
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-dark-700/50 rounded-full overflow-hidden mb-3">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                                className={`h-full bg-gradient-to-r ${gradientColor}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-text-secondary leading-relaxed mb-4">
                            {item.description}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
                          <div className="text-xs text-text-secondary">
                            <span className="text-accent-primary font-semibold">Step {items.length - index}</span> of {items.length}
                          </div>
                          <div className="text-xs text-text-secondary">
                            Updated: {new Date(item.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Journey Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="glass-effect p-6 rounded-xl border-2 border-dark-700 hover:border-accent-primary/40 transition-colors text-center">
                <div className="text-3xl font-bold text-accent-primary mb-2">
                  {items.length}
                </div>
                <p className="text-sm text-text-secondary">Active Explorations</p>
              </div>
              <div className="glass-effect p-6 rounded-xl border-2 border-dark-700 hover:border-accent-primary/40 transition-colors text-center">
                <div className="text-3xl font-bold text-accent-primary mb-2">
                  {items[0]?.title?.length || 0}
                </div>
                <p className="text-sm text-text-secondary">Current Focus</p>
              </div>
              <div className="glass-effect p-6 rounded-xl border-2 border-dark-700 hover:border-accent-primary/40 transition-colors text-center">
                <div className="text-3xl font-bold text-accent-primary mb-2">
                  ∞
                </div>
                <p className="text-sm text-text-secondary">Learning Potential</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {lastUpdated && (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-8 border-t border-dark-700 max-w-4xl mx-auto"
          >
            <p className="text-sm text-text-secondary">
              Last updated: {lastUpdated}
            </p>
          </motion.footer>
        )}
      </div>
    </SectionWrapper>
  );
};
