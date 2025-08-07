import React, { useState } from 'react';
import styles from './pricing.module.css';

export default function MovieTheaterPricing() {
  const [hoveredItem, setHoveredItem] = useState(null);

  const discounts = [
    { type: 'Student Discount', price: '25% OFF', icon: '🎓', popular: true },
    { type: 'Senior Discount (65+)', price: '20% OFF', icon: '👴', popular: false },
    { type: 'Child Discount (12 & under)', price: '30% OFF', icon: '👶', popular: false },
    { type: 'Matinee Special', price: '35% OFF', icon: '☀️', popular: false },
    { type: 'Group Booking (10+)', price: '15% OFF', icon: '👥', popular: false }
  ];

  const drinks = [
    { item: 'Small Soft Drink', price: '$4.50', icon: '🥤', size: 'small' },
    { item: 'Medium Soft Drink', price: '$5.50', icon: '🥤', size: 'medium' },
    { item: 'Large Soft Drink', price: '$6.50', icon: '🥤', size: 'large' },
    { item: 'Small Coffee', price: '$3.75', icon: '☕', size: 'small' },
    { item: 'Large Coffee', price: '$4.75', icon: '☕', size: 'large' },
    { item: 'Bottled Water', price: '$3.00', icon: '💧', size: 'regular' }
  ];

  const popcorn = [
    { item: 'Small Popcorn', price: '$6.00', icon: '🍿', size: 'small' },
    { item: 'Medium Popcorn', price: '$7.50', icon: '🍿', size: 'medium' },
    { item: 'Large Popcorn', price: '$9.00', icon: '🍿', size: 'large', popular: true },
    { item: 'Extra Butter', price: '$0.50', icon: '🧈', size: 'addon' },
    { item: 'Seasoning', price: '$0.75', icon: '🧂', size: 'addon' }
  ];

  const snacks = [
    { item: 'Nachos', price: '$7.50', icon: '🧀' },
    { item: 'Hot Dog', price: '$6.00', icon: '🌭' },
    { item: 'Pretzel', price: '$5.50', icon: '🥨' },
    { item: 'Candy (assorted)', price: '$4.50', icon: '🍬' },
    { item: 'Ice Cream Cup', price: '$5.00', icon: '🍦' },
    { item: 'Chips', price: '$3.50', icon: '🍟' }
  ];

  const combos = [
    { 
      name: 'Small Combo', 
      items: 'Small popcorn + Small drink', 
      price: '$9.50', 
      savings: 'Save $1.00',
      gradient: styles.comboBlue,
      icon: '🎯'
    },
    { 
      name: 'Medium Combo', 
      items: 'Medium popcorn + Medium drink', 
      price: '$11.50', 
      savings: 'Save $1.50',
      gradient: styles.comboPurple,
      popular: true,
      icon: '⭐'
    },
    { 
      name: 'Large Combo', 
      items: 'Large popcorn + Large drink', 
      price: '$13.50', 
      savings: 'Save $2.00',
      gradient: styles.comboOrange,
      icon: '🔥'
    },
    { 
      name: 'Date Night', 
      items: 'Large popcorn + 2 Medium drinks', 
      price: '$17.00', 
      savings: 'Save $2.00',
      gradient: styles.comboPink,
      icon: '💕'
    }
  ];

  const getItemClass = (title) => {
    if (title.includes('Discounts')) return styles.discountItem;
    if (title.includes('Beverages')) return styles.beverageItem;
    if (title.includes('Popcorn')) return styles.popcornItem;
    if (title.includes('Snacks')) return styles.snackItem;
    return '';
  };

  const PriceCard = ({ title, items }) => (
    <div className={styles.priceCard}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.itemsGrid}>
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`${styles.priceItem} ${getItemClass(title)} ${
              item.popular ? styles.popularItem : ''
            }`}
            onMouseEnter={() => setHoveredItem(`${title}-${index}`)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {item.popular && (
              <div className={styles.popularBadge}>POPULAR</div>
            )}
            <div className={styles.itemContent}>
              <div className={styles.itemInfo}>
                <span className={styles.itemIcon}>{item.icon}</span>
                <span className={styles.itemName}>{item.type || item.item}</span>
              </div>
              <span className={styles.itemPrice}>{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.animatedBackground}>
        <div className={styles.bgOrb1}></div>
        <div className={styles.bgOrb2}></div>
        <div className={styles.bgOrb3}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <h1 className={styles.mainTitle}>🎬 CINEMA DELUXE 🍿</h1>
            <p className={styles.subtitle}>
              Premium Movie Experience • Fresh Snacks • Great Prices
            </p>
            <div className={styles.headerInfo}>
              <div className={styles.infoItem}>
                
                <span>Open Daily</span>
              </div>
              <div className={styles.infoItem}>
                
                <span>All Ages Welcome</span>
              </div>
              <div className={styles.infoItem}>
               
                <span>5-Star Experience</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.grid}>
          <PriceCard title="💸 Special Discounts" items={discounts} />
          <PriceCard title="🥤 Beverages" items={drinks} />
        </div>
        
        <div className={styles.grid}>
          <PriceCard title="🍿 Fresh Popcorn" items={popcorn} />
          <PriceCard title="🍭 Delicious Snacks" items={snacks} />
        </div>

        {/* Combo Deals */}
        <div className={styles.comboSection}>
          <h2 className={styles.comboTitle}>💥 COMBO DEALS - BEST VALUE! 💥</h2>
          <div className={styles.comboGrid}>
            {combos.map((combo, index) => (
              <div 
                key={index} 
                className={`${styles.comboCard} ${combo.gradient} ${
                  combo.popular ? styles.comboPopular : ''
                }`}
              >
                {combo.popular && (
                  <div className={styles.bestDealBadge}>🌟 BEST DEAL 🌟</div>
                )}
                <div className={styles.comboContent}>
                  <div className={styles.comboIcon}>{combo.icon}</div>
                  <h3 className={styles.comboName}>{combo.name}</h3>
                  <p className={styles.comboItems}>{combo.items}</p>
                  <div className={styles.comboPricing}>
                    <div className={styles.comboPrice}>{combo.price}</div>
                    <div className={styles.comboSavings}>{combo.savings}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h2 className={styles.infoTitle}>
            <span className={styles.infoTitleIcon}>ℹ️</span>
            Important Information
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoSubsection}>
              <h3>💰 Pricing Details</h3>
              <ul className={styles.infoList}>
                <li>• All prices include taxes</li>
                <li>• Group discounts for 20+ people</li>
                <li>• Large refills only $2.00</li>
                <li>• Student & Senior ID required</li>
              </ul>
            </div>
            <div className={styles.infoSubsection}>
              <h3>📋 Theater Policies</h3>
              <ul className={styles.infoList}>
                <li>• No outside food or drinks</li>
                <li>• Premium seating available</li>
                <li>• Mobile ordering coming soon</li>
                <li>• Clean theaters guaranteed</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}