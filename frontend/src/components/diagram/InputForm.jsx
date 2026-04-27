import { useState } from 'react';

const DIAGRAM_TYPES = [
  {
    id: 'decision_tree',
    label: 'Decision Tree',
    description: 'Yes/No branching decisions',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    placeholder: "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park. At the park, if it's crowded, go to the beach, otherwise stay.",
    color: 'indigo',
  },
  {
    id: 'system_architecture',
    label: 'System Architecture',
    description: 'Services, databases & APIs',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    placeholder: 'A React web app connects to a Node.js API server. The API uses PostgreSQL for data and Redis for caching. It also integrates with Stripe for payments and SendGrid for emails.',
    color: 'cyan',
  },
  {
    id: 'data_flow',
    label: 'Data Flow',
    description: 'How data moves through a system',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    placeholder: 'A customer places an order on the website. The order service validates it, saves it to the database, sends a notification to the warehouse, and emails a receipt to the customer.',
    color: 'emerald',
  },
  {
    id: 'process_flow',
    label: 'Process Flow',
    description: 'Step-by-step workflow',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
    placeholder: 'Employee submits expense report. Manager reviews it. If approved, finance processes the payment. If rejected, employee revises and resubmits. After payment, the report is archived.',
    color: 'rose',
  },
];

const COLOR_CLASSES = {
  indigo: {
    selected: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200',
    icon: 'text-indigo-600',
    hover: 'hover:border-indigo-300 hover:bg-indigo-50/50',
  },
  cyan: {
    selected: 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200',
    icon: 'text-cyan-600',
    hover: 'hover:border-cyan-300 hover:bg-cyan-50/50',
  },
  emerald: {
    selected: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
    icon: 'text-emerald-600',
    hover: 'hover:border-emerald-300 hover:bg-emerald-50/50',
  },
  rose: {
    selected: 'border-rose-500 bg-rose-50 ring-2 ring-rose-200',
    icon: 'text-rose-600',
    hover: 'hover:border-rose-300 hover:bg-rose-50/50',
  },
};

export default function InputForm({ onSubmit, disabled }) {
  const [description, setDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [diagramType, setDiagramType] = useState('decision_tree');

  const selectedType = DIAGRAM_TYPES.find(t => t.id === diagramType);

  const handleChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setCharCount(value.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < 1000) {
      console.warn('Submission too fast - please wait before resubmitting');
      return;
    }

    const trimmed = description.trim();

    if (trimmed.length < 10) {
      alert('Please enter at least 10 characters');
      return;
    }

    if (trimmed.length > 5000) {
      alert('Description must be less than 5000 characters');
      return;
    }

    setLastSubmitTime(now);
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 1000);
    
    onSubmit(trimmed, diagramType);
  };

  const handleClear = () => {
    setDescription('');
    setCharCount(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Diagram Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Diagram Type
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DIAGRAM_TYPES.map((type) => {
            const isSelected = diagramType === type.id;
            const colors = COLOR_CLASSES[type.color];
            return (
              <button
                key={type.id}
                type="button"
                disabled={disabled}
                onClick={() => setDiagramType(type.id)}
                className={`
                  relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isSelected ? colors.selected : `border-gray-200 bg-white ${colors.hover}`}
                `}
              >
                <div className={isSelected ? colors.icon : 'text-gray-400'}>
                  {type.icon}
                </div>
                <span className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                  {type.label}
                </span>
                <span className="text-xs text-gray-400 text-center leading-tight">
                  {type.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={handleChange}
          placeholder={`Describe your diagram... Example: ${selectedType?.placeholder || ''}`}
          disabled={disabled}
          rows="5"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
        />
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {charCount} / 5000 characters
          </p>
          {charCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={disabled || charCount < 10 || submitCooldown}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Generating...' : submitCooldown ? 'Please wait...' : 'Generate Diagram'}
        </button>
      </div>
    </form>
  );
}
