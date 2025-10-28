const ACHIEVEMENTS = {
  FIRST_FEED: {
    id: 'first-feed',
    title: 'First Meal',
    description: 'Fed the cat for the first time',
    icon: '🍽️'
  },
  FOOD_HOARDER: {
    id: 'food-hoarder',
    title: 'Food Hoarder',
    description: 'Collected 50 food items',
    icon: '🏪'
  },
  HAPPY_CAT: {
    id: 'happy-cat',
    title: 'Happy Cat',
    description: 'Kept happiness at 100% for 5 minutes',
    icon: '😺'
  },
  TREAT_MASTER: {
    id: 'treat-master',
    title: 'Treat Master',
    description: 'Given 20 treats',
    icon: '🍬'
  },
  PLAY_TIME: {
    id: 'play-time',
    title: 'Play Time',
    description: 'Played with the cat 10 times',
    icon: '🎮'
  },
  NIGHT_OWL: {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Played with the cat at midnight',
    icon: '🌙'
  },
  DEDICATED_OWNER: {
    id: 'dedicated-owner',
    title: 'Dedicated Owner',
    description: 'Visited the cat for 5 days in a row',
    icon: '🏆'
  },
  PERFECT_CARE: {
    id: 'perfect-care',
    title: 'Perfect Care',
    description: 'Kept both hunger and happiness above 80% for 10 minutes',
    icon: '⭐'
  }
};

class AchievementSystem {
  constructor() {
    this.achieved = this.loadAchievements();
    this.stats = this.loadStats();
  }

  loadAchievements() {
    try {
      return JSON.parse(localStorage.getItem('feed-the-cat:achievements')) || {};
    } catch (e) {
      return {};
    }
  }

  loadStats() {
    try {
      return JSON.parse(localStorage.getItem('feed-the-cat:stats')) || {
        totalFeeds: 0,
        totalTreats: 0,
        totalPlays: 0,
        lastVisit: null,
        visitStreak: 0,
        maxFood: 0
      };
    } catch (e) {
      return {
        totalFeeds: 0,
        totalTreats: 0,
        totalPlays: 0,
        lastVisit: null,
        visitStreak: 0,
        maxFood: 0
      };
    }
  }

  saveProgress() {
    localStorage.setItem('feed-the-cat:achievements', JSON.stringify(this.achieved));
    localStorage.setItem('feed-the-cat:stats', JSON.stringify(this.stats));
  }

  checkAchievement(id) {
    return this.achieved[id] || false;
  }

  awardAchievement(id) {
    if (this.achieved[id] || !ACHIEVEMENTS[id]) return false;
    
    this.achieved[id] = {
      timestamp: Date.now(),
      id: id
    };
    
    this.saveProgress();
    this.showAchievementNotification(ACHIEVEMENTS[id]);
    return true;
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-text">
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  updateStats(state) {
    // Update daily streak
    const today = new Date().toDateString();
    if (this.stats.lastVisit !== today) {
      if (this.stats.lastVisit === new Date(Date.now() - 86400000).toDateString()) {
        this.stats.visitStreak++;
        if (this.stats.visitStreak >= 5) {
          this.awardAchievement('DEDICATED_OWNER');
        }
      } else {
        this.stats.visitStreak = 1;
      }
      this.stats.lastVisit = today;
    }

    // Update max food count
    if (state.food > this.stats.maxFood) {
      this.stats.maxFood = state.food;
      if (state.food >= 50) {
        this.awardAchievement('FOOD_HOARDER');
      }
    }

    // Night owl achievement
    const hour = new Date().getHours();
    if (hour >= 0 && hour <= 4) {
      this.awardAchievement('NIGHT_OWL');
    }

    this.saveProgress();
  }
}

// Export for use in main app
window.AchievementSystem = AchievementSystem;