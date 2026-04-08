export const getJobIcon = (jobType) => {
  const icons = {
    'Мойщик': 'water',
    'Официант': 'restaurant',
    'Грузчик': 'cube',
    'Бармен': 'wine',
    'Повар': 'fast-food',
    'Промоутер': 'person-add',
    'Разнорабочий': 'build',
    'Помощник': 'hand'
  };
  return icons[jobType] || 'person';
};

export const getJobColor = (jobType) => {
  const colors = {
    'Мойщик': '#3B82F6',
    'Официант': '#10B981',
    'Грузчик': '#F59E0B',
    'Бармен': '#8B5CF6',
    'Повар': '#EC4899',
    'Промоутер': '#14B8A6',
    'Разнорабочий': '#F97316',
    'Помощник': '#84CC16'
  };
  return colors[jobType] || '#6366F1';
};