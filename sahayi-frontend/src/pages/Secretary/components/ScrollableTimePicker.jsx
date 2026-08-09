import React from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

function ScrollColumn({ label, options, selected, onSelect }) {
  const currentIndex = options.indexOf(selected);

  const handlePrev = () => {
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    onSelect(options[prevIdx]);
  };

  const handleNext = () => {
    const nextIdx = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    onSelect(options[nextIdx]);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handlePrev();
    } else if (e.deltaY > 0) {
      handleNext();
    }
  };

  return (
    <div className="sec-time-picker-col">
      <span className="sec-time-col-label">{label}</span>
      <button type="button" className="sec-time-arrow-btn" onClick={handlePrev} title={`Previous ${label}`}>
        <ChevronUp size={16} />
      </button>

      <div className="sec-time-wheel-container" onWheel={handleWheel}>
        {options.map((opt) => {
          const isSelected = opt === selected;
          return (
            <div
              key={opt}
              className={`sec-time-wheel-item ${isSelected ? 'sec-time-wheel-item--active' : ''}`}
              onClick={() => onSelect(opt)}
            >
              {opt}
            </div>
          );
        })}
      </div>

      <button type="button" className="sec-time-arrow-btn" onClick={handleNext} title={`Next ${label}`}>
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

function ScrollableTimePicker({ value, onChange }) {
  // Parse string like "10:00 AM" or "02:30 PM" or "10:00:00 AM"
  const parseTime = (val) => {
    const defaultVal = { hour: '10', minute: '00', period: 'AM' };
    if (!val) return defaultVal;
    const str = String(val).trim();
    const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (match) {
      return {
        hour: match[1].padStart(2, '0'),
        minute: match[2].padStart(2, '0'),
        period: match[3].toUpperCase()
      };
    }
    return defaultVal;
  };

  const { hour, minute, period } = parseTime(value);

  const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periodOptions = ['AM', 'PM'];

  const updateTime = (h, m, p) => {
    const formatted = `${h}:${m} ${p}`;
    onChange(formatted);
  };

  return (
    <div className="sec-time-picker-wrapper">
      <div className="sec-time-picker-header">
        <Clock size={15} color="#1a1a1a" />
        <span>Select Time (HH : MM AM/PM)</span>
      </div>

      <div className="sec-time-picker-wheels">
        <ScrollColumn
          label="HOUR"
          options={hoursOptions}
          selected={hour}
          onSelect={(h) => updateTime(h, minute, period)}
        />
        <div className="sec-time-separator">:</div>
        <ScrollColumn
          label="MIN"
          options={minutesOptions}
          selected={minute}
          onSelect={(m) => updateTime(hour, m, period)}
        />
        <ScrollColumn
          label="PERIOD"
          options={periodOptions}
          selected={period}
          onSelect={(p) => updateTime(hour, minute, p)}
        />
      </div>

      <div className="sec-time-readout">
        Selected: <strong>{hour}:{minute} {period}</strong>
      </div>
    </div>
  );
}

export default ScrollableTimePicker;
