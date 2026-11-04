import { forwardRef, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, hitTarget, radius, space, useTheme } from '@/theme';

import { Text } from './text';

type InputRef = ComponentRef<typeof TextInput>;

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  helper?: string;
  /** rendered on the leading side, e.g. a country code */
  prefix?: string;
  /** keep Latin digits/phones visually LTR inside the RTL layout */
  ltr?: boolean;
}

/** Visible label above, error under the field (never placeholder-only). */
export const TextField = forwardRef<InputRef, FieldProps>(function TextField(
  { label, error, helper, prefix, ltr, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: space.xs + 2 }}>
      <Text variant="label" tone="textMuted" nativeID={`${label}-label`}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor, borderWidth: focused || error ? 1.5 : 1 },
          ltr && styles.ltrRow,
        ]}>
        {prefix && (
          <View style={[styles.prefix, { borderColor: colors.border }]}>
            <Text variant="bodyStrong" tone="textMuted">
              {prefix}
            </Text>
          </View>
        )}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, ltr && { writingDirection: 'ltr' }, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone="textSubtle">
          {helper}
        </Text>
      ) : null}
    </View>
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
  const { colors } = useTheme();
  const ref = useRef<InputRef>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      <View style={[styles.otpRow]}>
        {Array.from({ length }, (_, i) => {
          const active = focused && (i === value.length || (i === length - 1 && value.length === length));
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: error
                    ? colors.danger
                    : active
                      ? colors.primary
                      : value[i]
                        ? colors.borderStrong
                        : colors.border,
                  borderWidth: active || error ? 2 : 1,
                },
              ]}>
              <Text variant="title" align="center">
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
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
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        accessibilityLabel={label}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  // RTL flips 'row' on native and web alike; reversing it gives a left-to-right "+20 | 01…" field.
  ltrRow: { flexDirection: 'row-reverse' },
  prefix: { paddingHorizontal: space.lg, height: '100%', justifyContent: 'center', borderStartWidth: 1 },
  input: {
    flex: 1,
    minHeight: hitTarget,
    paddingHorizontal: space.lg,
    fontFamily: fonts.medium,
    fontSize: 17,
    // the container draws the focus border; drop the browser's second ring on web
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  // row-reverse inside the RTL layout = boxes run left-to-right (digit 1 on the left)
  otpRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: space.sm },
  otpBox: { width: 48, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
