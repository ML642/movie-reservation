import React, { useEffect, useId, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import "./CustomSelect.css";

const CustomSelect = ({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const closeOnOutsidePress = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  const moveSelection = (direction) => {
    const currentIndex = options.findIndex((option) => option.value === value);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    onChange(options[nextIndex].value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((current) => !current);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      moveSelection(1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      moveSelection(-1);
    }
  };

  return (
    <div className={`custom-select ${isOpen ? "is-open" : ""} ${className}`.trim()} ref={rootRef}>
      {label && (
        <label id={`${selectId}-label`} className="custom-select-label">
          {label}
        </label>
      )}

      <div className="custom-select-control">
        <button
          id={selectId}
          type="button"
          className="custom-select-button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-labelledby={label ? `${selectId}-label ${selectId}` : undefined}
          onClick={() => setIsOpen((current) => !current)}
          onKeyDown={handleKeyDown}
        >
          <span className="custom-select-value">{selectedOption?.label}</span>
          <FaChevronDown className="custom-select-icon" aria-hidden="true" />
        </button>

        {isOpen && (
          <div id={listboxId} className="custom-select-list" role="listbox" aria-labelledby={label ? `${selectId}-label` : undefined}>
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`custom-select-option ${isSelected ? "is-selected" : ""}`.trim()}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
