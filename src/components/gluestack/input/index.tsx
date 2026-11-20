'use client';
import React from 'react';
import { createInput } from '@gluestack-ui/core/input/creator';
import { View, Pressable, TextInput } from 'react-native';
import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { withUniwind } from 'uniwind';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { UIIcon } from '@gluestack-ui/core/icon/creator';

const SCOPE = 'INPUT';

const StyledUIIcon = withUniwind(UIIcon);

const UIInput = createInput({
  Root: withStyleContext(View, SCOPE),
  Icon: StyledUIIcon,
  Slot: Pressable,
  Input: TextInput,
});

// Liquid Glass field: solid card fill, definite height (iOS TextInput otherwise reports a tall intrinsic size).
const inputStyle = tva({
  base: 'h-14 w-full flex-row items-stretch overflow-hidden rounded-field border-2 border-border bg-card data-[focus=true]:border-primary data-[invalid=true]:border-destructive data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
});

const inputIconStyle = tva({
  base: 'justify-center items-center text-muted-foreground fill-none h-5 w-5',
});

const inputSlotStyle = tva({
  base: 'justify-center items-center web:disabled:cursor-not-allowed',
});

const inputFieldStyle = tva({
  base: 'h-full flex-1 px-4 py-0 font-medium text-body text-foreground placeholder:text-subtle-foreground web:outline-none web:cursor-text web:data-[disabled=true]:cursor-not-allowed',
});

type IInputProps = React.ComponentProps<typeof UIInput> & VariantProps<typeof inputStyle> & { className?: string };
const Input = React.forwardRef<React.ComponentRef<typeof UIInput>, IInputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <UIInput ref={ref} {...props} className={inputStyle({ class: className })} context={{}} />;
});

type IInputIconProps = React.ComponentProps<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & {
    className?: string;
    height?: number;
    width?: number;
  };

const InputIcon = React.forwardRef<React.ComponentRef<typeof UIInput.Icon>, IInputIconProps>(function InputIcon(
  { className, ...props },
  ref,
) {
  return <UIInput.Icon ref={ref} {...props} className={inputIconStyle({ class: className })} />;
});

type IInputSlotProps = React.ComponentProps<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<React.ComponentRef<typeof UIInput.Slot>, IInputSlotProps>(function InputSlot(
  { className, ...props },
  ref,
) {
  return (
    <UIInput.Slot
      ref={ref}
      {...props}
      className={inputSlotStyle({
        class: className,
      })}
    />
  );
});

type IInputFieldProps = React.ComponentProps<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<React.ComponentRef<typeof UIInput.Input>, IInputFieldProps>(function InputField(
  { className, ...props },
  ref,
) {
  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={inputFieldStyle({
        class: className,
      })}
    />
  );
});

Input.displayName = 'Input';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputIcon, InputSlot };
