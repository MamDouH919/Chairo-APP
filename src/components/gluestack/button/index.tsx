'use client';
import { createButton } from '@gluestack-ui/core/button/creator';
import { UIIcon } from '@gluestack-ui/core/icon/creator';
import { tva, useStyleContext, withStyleContext, type VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { withUniwind } from 'uniwind';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/motion';
const SCOPE = 'BUTTON';
const Root = withStyleContext(PressableScale, SCOPE);
const StyledUIIcon = withUniwind(UIIcon);
const UIButton = createButton({
  Root: Root,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: StyledUIIcon,
});
const buttonStyle = tva({
  base: 'rounded-full border border-transparent flex-row items-center justify-center data-[focus-visible=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[disabled=true]:opacity-40 gap-2 h-fit',
  variants: {
    variant: {
      primary:
        'bg-primary border-primary shadow-primary/35 data-[active=true]:bg-primary-pressed data-[hover=true]:bg-primary-pressed',
      secondary: 'bg-secondary data-[active=true]:bg-muted data-[hover=true]:bg-muted',
      // outline and glass read the same in the Liquid Glass language: a frosted pill
      outline: 'bg-card border-foreground/10 data-[active=true]:bg-glass-pressed data-[hover=true]:bg-glass-pressed',
      glass: 'bg-card border-foreground/10 data-[active=true]:bg-glass-pressed data-[hover=true]:bg-glass-pressed',
      ghost: 'data-[active=true]:bg-muted data-[hover=true]:bg-muted',
      danger: 'bg-destructive-soft data-[active=true]:bg-muted data-[hover=true]:bg-muted',
      ink: 'bg-ink data-[active=true]:bg-foreground data-[hover=true]:bg-foreground',
    },
    size: {
      md: 'min-h-12 px-4',
      lg: 'min-h-14 px-6',
      icon: 'h-12 w-12',
    },
  },
});
const buttonTextStyle = tva({
  base: 'web:select-none',
  parentVariants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      glass: 'text-foreground',
      ghost: 'text-primary',
      danger: 'text-destructive',
      ink: 'text-ink-foreground',
    },
    size: {
      md: 'text-label font-medium',
      lg: 'text-body font-semibold',
      icon: 'text-label font-medium',
    },
  },
});

const buttonSpinnerStyle = tva({
  base: '',
  parentVariants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      glass: 'text-foreground',
      ghost: 'text-primary',
      danger: 'text-destructive',
      ink: 'text-ink-foreground',
    },
    size: {
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
      icon: 'h-5 w-5',
    },
  },
});

const buttonIconStyle = tva({
  base: 'fill-none pointer-events-none shrink-0',
  parentVariants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      glass: 'text-foreground',
      ghost: 'text-primary',
      danger: 'text-destructive',
      ink: 'text-ink-foreground',
    },
    size: {
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
      icon: 'h-5 w-5',
    },
  },
});
const buttonGroupStyle = tva({
  base: '',
  variants: {
    space: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-5',
      '2xl': 'gap-6',
      '3xl': 'gap-7',
      '4xl': 'gap-8',
    },
    isAttached: {
      true: 'gap-0',
    },
    flexDirection: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
  },
});
type IButtonProps = Omit<React.ComponentPropsWithoutRef<typeof UIButton>, 'context'> &
  VariantProps<typeof buttonStyle> & { className?: string };
const Button = React.forwardRef<React.ElementRef<typeof UIButton>, IButtonProps>(
  ({ className, variant = 'primary', size = 'lg', ...props }, ref) => {
    return (
      <UIButton
        ref={ref}
        {...props}
        className={buttonStyle({ variant, size, class: className })}
        context={{ variant, size }}
      />
    );
  },
);
type IButtonTextProps = React.ComponentPropsWithoutRef<typeof UIButton.Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string };
const ButtonText = React.forwardRef<React.ElementRef<typeof UIButton.Text>, IButtonTextProps>(
  ({ className, size, ...props }, ref) => {
    const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);
    return (
      <UIButton.Text
        ref={ref}
        {...props}
        className={buttonTextStyle({
          parentVariants: {
            size: parentSize,
            variant: parentVariant,
          },
          size,
          class: className,
        })}
      />
    );
  },
);
const ButtonSpinner = React.forwardRef<
  React.ElementRef<typeof UIButton.Spinner>,
  React.ComponentPropsWithoutRef<typeof UIButton.Spinner>
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);
  return (
    <UIButton.Spinner
      ref={ref}
      {...props}
      className={buttonSpinnerStyle({ parentVariants: { size: parentSize }, class: className })}
    />
  );
});
type IButtonIcon = React.ComponentPropsWithoutRef<typeof UIButton.Icon> &
  VariantProps<typeof buttonIconStyle> & {
    className?: string | undefined;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };
const ButtonIcon = React.forwardRef<React.ElementRef<typeof UIButton.Icon>, IButtonIcon>(
  ({ className, size, ...props }, ref) => {
    const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);
    if (typeof size === 'number') {
      return <UIButton.Icon ref={ref} {...props} className={buttonIconStyle({ class: className })} size={size} />;
    } else if ((props.height !== undefined || props.width !== undefined) && size === undefined) {
      return <UIButton.Icon ref={ref} {...props} className={buttonIconStyle({ class: className })} />;
    }
    return (
      <UIButton.Icon
        {...props}
        className={buttonIconStyle({
          parentVariants: {
            size: parentSize,
            variant: parentVariant,
          },
          size,
          class: className,
        })}
        ref={ref}
      />
    );
  },
);
type IButtonGroupProps = React.ComponentPropsWithoutRef<typeof UIButton.Group> & VariantProps<typeof buttonGroupStyle>;
const ButtonGroup = React.forwardRef<React.ElementRef<typeof UIButton.Group>, IButtonGroupProps>(
  ({ className, space = 'md', isAttached = false, flexDirection = 'column', ...props }, ref) => {
    return (
      <UIButton.Group
        className={buttonGroupStyle({
          class: className,
          space,
          isAttached,
          flexDirection,
        })}
        {...props}
        ref={ref}
      />
    );
  },
);
Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
ButtonSpinner.displayName = 'ButtonSpinner';
ButtonIcon.displayName = 'ButtonIcon';
ButtonGroup.displayName = 'ButtonGroup';
export { Button, ButtonGroup, ButtonIcon, ButtonSpinner, ButtonText };
