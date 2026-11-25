import React from 'react';
import { AccessoryType, CharacterConfig } from '../game/types';
import {
  HAIR_SWATCHES,
  PANTS_SWATCHES,
  SHIRT_SWATCHES,
  SHOE_SWATCHES,
  SKIN_SWATCHES,
} from '../game/storage';

interface CharacterEditorFormProps {
  value: CharacterConfig;
  onChange: (updated: CharacterConfig) => void;
  nameLabel: string;
  placeholder: string;
}

const ACCESSORIES: { id: AccessoryType; label: string }[] = [
  { id: 'cap', label: 'Cap' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'backpack', label: 'Backpack' },
  { id: 'bandana', label: 'Bandana' },
  { id: 'none', label: 'None' },
];

function SwatchRow({
  label,
  swatches,
  selected,
  onSelect,
}: {
  label: string;
  swatches: string[];
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-slate-300">{label}</div>
      <div className="flex flex-wrap gap-2">
        {swatches.map((hex) => {
          const isSelected = selected.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onSelect(hex)}
              aria-label={`${label} ${hex}`}
              className={`w-8 h-8 rounded-lg border transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                isSelected
                  ? 'border-white scale-110 ring-2 ring-amber-400'
                  : 'border-white/20 hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

export const CharacterEditorForm: React.FC<CharacterEditorFormProps> = ({
  value,
  onChange,
  nameLabel,
  placeholder,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          {nameLabel}
        </label>
        <input
          type="text"
          maxLength={18}
          value={value.name}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-white/15 text-slate-50 text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="space-y-1.5">
        <div className="text-xs font-medium text-slate-300">Accessory</div>
        <div className="flex flex-wrap gap-1.5">
          {ACCESSORIES.map((acc) => {
            const active = value.accessory === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onChange({ ...value, accessory: acc.id })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {acc.label}
              </button>
            );
          })}
        </div>
      </div>

      <SwatchRow
        label="Jersey / Hoodie Color"
        swatches={SHIRT_SWATCHES}
        selected={value.shirtColor}
        onSelect={(shirtColor) => onChange({ ...value, shirtColor })}
      />

      <SwatchRow
        label="Pants Color"
        swatches={PANTS_SWATCHES}
        selected={value.pantsColor}
        onSelect={(pantsColor) => onChange({ ...value, pantsColor })}
      />

      <SwatchRow
        label="Skin Tone"
        swatches={SKIN_SWATCHES}
        selected={value.skinTone}
        onSelect={(skinTone) => onChange({ ...value, skinTone })}
      />

      <SwatchRow
        label="Hair Color"
        swatches={HAIR_SWATCHES}
        selected={value.hairColor}
        onSelect={(hairColor) => onChange({ ...value, hairColor })}
      />

      <SwatchRow
        label="Sneaker Color"
        swatches={SHOE_SWATCHES}
        selected={value.shoeColor}
        onSelect={(shoeColor) => onChange({ ...value, shoeColor })}
      />
    </div>
  );
};
