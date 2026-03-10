import React, { useRef, useEffect } from 'react';

const DynamicScroller = ({ activeDayIndex, setActiveDayIndex, days }) => {
  const scrollRef = useRef(null);
  const buttonRefs = useRef({});

  // Shorten day names for mobile (e.g., "Monday - Push" -> "Mon")
  const formatDay = (fullName) => {
    return fullName.split(' ')[0].substring(0, 3);
  };

  useEffect(() => {
    const activeButton = buttonRefs.current[activeDayIndex];
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeDayIndex]);

  // Reorder days from Mon-Sun for the UI
  const orderedDays = [
    days.find(d => d.dayOfWeek === 1), // Mon
    days.find(d => d.dayOfWeek === 2), // Tue
    days.find(d => d.dayOfWeek === 3), // Wed
    days.find(d => d.dayOfWeek === 4), // Thu
    days.find(d => d.dayOfWeek === 5), // Fri
    days.find(d => d.dayOfWeek === 6), // Sat
    days.find(d => d.dayOfWeek === 0), // Sun
  ];

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40 shadow-xl overflow-hidden backdrop-blur-md bg-opacity-90">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-3 md:justify-center"
      >
        {orderedDays.map((day) => {
          if (!day) return null;
          const isActive = activeDayIndex === day.dayOfWeek;
          
          return (
            <button
              key={day._id}
              ref={(el) => {
                if (el) buttonRefs.current[day.dayOfWeek] = el;
              }}
              onClick={() => setActiveDayIndex(day.dayOfWeek)}
              className={`relative shrink-0 w-16 h-20 md:w-20 md:h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
                isActive ? 'text-black' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
              }`}
            >
              {isActive && (
                <div
                  className="absolute inset-0 bg-yellow-500 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                />
              )}
              
              <span className="relative z-10 text-xs font-bold uppercase tracking-wider mb-1">
                {formatDay(day.dayName)}
              </span>
              <span className={`relative z-10 text-2xl md:text-3xl font-black ${isActive ? 'text-black' : 'text-neutral-300'}`}>
                {day.dayOfWeek === 0 ? 
                    <span className="text-xl">💤</span> : 
                    day.blocks.length}
              </span>
              <span className="relative z-10 text-[9px] uppercase font-bold tracking-widest mt-1 opacity-70">
                {day.isRestDay ? 'Rest' : 'Moves'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicScroller;
