import { forwardRef, useRef, useState, type ComponentRef } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

import { Box } from '@/components/gluestack/box';
import { Input, InputField, InputSlot } from '@/components/gluestack/input';
import { Pressable } from '@/components/gluestack/pressable';

import { Text } from './text';

type InputRef = ComponentRef<typeof TextInput>;

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  helper?: string;
  /** rendered on the leading side, e.g. a country code */
  prefix?: string;
  /** small glyph before the prefix, e.g. a flag */
  prefixIcon?: string;
  /** keep Latin digits/phones visually LTR inside the RTL layout */
  ltr?: boolean;
}

/** Visible label above, error under the field (never placeholder-only). */
export const TextField = forwardRef<InputRef, FieldProps>(function TextField(
  { label, error, helper, prefix, prefixIcon, ltr, style, multiline, ...rest },
  ref,
) {
  return (
    <Box className="gap-1.5">
      <Text variant="label" tone="textMuted" nativeID={`${label}-label`}>
        {label}
      </Text>
      <Input
        isInvalid={!!error}
        // RTL flips 'row' on native and web alike; reversing it gives a left-to-right "+20 | 01…" field.
        className={`${multiline ? 'h-auto min-h-26' : ''} ${ltr ? 'flex-row-reverse' : ''}`}>
        {prefix && (
          // flag, code, divider read left-to-right on the physical left edge (row-reverse undoes RTL)
          <InputSlot className={`items-center gap-1.5 ${ltr ? 'flex-row-reverse pl-4' : 'flex-row ps-4'}`}>
            {prefixIcon && <Text className="text-xl">{prefixIcon}</Text>}
            <Text variant="bodyStrong">{prefix}</Text>
            <Box className="ms-2 h-6 w-px bg-border" />
          </InputSlot>
        )}
        <InputField
          // creator types its ref loosely; the instance is a plain TextInput
          ref={ref as never}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          maxFontSizeMultiplier={1.4}
          selectionColorClassName="accent-primary"
          multiline={multiline}
          className={multiline ? 'h-auto py-3 text-top leading-6' : ''}
          style={[ltr ? { writingDirection: 'ltr' } : null, style]}
          {...rest}
        />
      </Input>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone="textSubtle">
          {helper}
        </Text>
      ) : null}
    </Box>
  );
});

interface OtpProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  label: string;
}

/**
 * One real TextInput (paste + SMS autofill + password managers work), drawn as boxes.
 * Boxes are LTR: codes are read left-to-right even in Arabic UI.
 */
export function OtpInput({ value, onChange, length = 6, error, autoFocus, label }: OtpProps) {
  const ref = useRef<InputRef>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      {/* row-reverse inside the RTL layout = boxes run left-to-right (digit 1 on the left) */}
      <Box className="flex-row-reverse justify-center gap-2">
        {Array.from({ length }, (_, i) => {
          const active = focused && (i === value.length || (i === length - 1 && value.length === length));
          const border = error
            ? 'border-2 border-destructive'
            : active
              ? 'border-2 border-primary'
              : value[i]
                ? 'border border-border-strong'
                : 'border border-foreground/10';
          return (
            <Box key={i} className={`h-15 w-12 items-center justify-center rounded-lg bg-card ${border}`}>
              <Text variant="title" align="center">
                {value[i] ?? ''}
              </Text>
            </Box>
          );
        })}
      </Box>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) =>
          onChange(
            t
              .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
              .replace(/\D/g, '')
              .slice(0, length),
          )
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        maxFontSizeMultiplier={1.3}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        accessibilityLabel={label}
        caretHidden
        className="absolute h-px w-px opacity-0"
      />
    </Pressable>
  );
}
