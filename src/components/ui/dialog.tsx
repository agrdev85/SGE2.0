import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWallpaperConfig, getAuroraPreset } from "@/hooks/useWallpaperConfig";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

function AuroraAnimation({ colors, speed = 15, intensity = 60 }: { colors: string[]; speed?: number; intensity?: number }) {
  const baseOpacity = intensity / 100;
  const speedMultiplier = 15 / speed;
  
  return (
    <>
      <style>{`
        @keyframes aurora-wave-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: ${baseOpacity * 0.4}; }
          33% { transform: translate(30px, -20px) scale(1.1); opacity: ${baseOpacity * 0.6}; }
          66% { transform: translate(-20px, 20px) scale(0.95); opacity: ${baseOpacity * 0.5}; }
        }
        @keyframes aurora-wave-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: ${baseOpacity * 0.3}; }
          50% { transform: translate(-40px, 30px) scale(1.15); opacity: ${baseOpacity * 0.5}; }
        }
        @keyframes aurora-wave-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: ${baseOpacity * 0.35}; }
          33% { transform: translate(25px, 25px) rotate(5deg); opacity: ${baseOpacity * 0.55}; }
          66% { transform: translate(-15px, -15px) rotate(-3deg); opacity: ${baseOpacity * 0.4}; }
        }
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          mix-blend-mode: screen;
        }
        .aurora-blob-1 {
          width: 60vw;
          height: 60vh;
          top: -20%;
          left: -10%;
          background: linear-gradient(135deg, var(--aurora-1) 0%, transparent 70%);
          animation: aurora-wave-1 ${speed * speedMultiplier}s ease-in-out infinite;
        }
        .aurora-blob-2 {
          width: 50vw;
          height: 50vh;
          bottom: -10%;
          right: -5%;
          background: linear-gradient(45deg, transparent 0%, var(--aurora-2) 100%);
          animation: aurora-wave-2 ${speed * speedMultiplier * 1.2}s ease-in-out infinite;
        }
        .aurora-blob-3 {
          width: 40vw;
          height: 40vh;
          top: 30%;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, var(--aurora-3) 0%, transparent 60%);
          animation: aurora-wave-3 ${speed * speedMultiplier * 1.33}s ease-in-out infinite;
        }
        .aurora-blob-4 {
          width: 35vw;
          height: 35vh;
          top: 10%;
          right: 20%;
          background: linear-gradient(225deg, var(--aurora-4) 0%, transparent 70%);
          animation: aurora-wave-1 ${speed * speedMultiplier * 1.47}s ease-in-out infinite reverse;
        }
      `}</style>
      <div 
        className="aurora-blob aurora-blob-1"
        style={{ 
          '--aurora-1': colors[0],
          '--aurora-2': colors[1],
          '--aurora-3': colors[2],
          '--aurora-4': colors[3] || colors[0],
        } as React.CSSProperties}
      />
      <div 
        className="aurora-blob aurora-blob-2"
        style={{ 
          '--aurora-1': colors[0],
          '--aurora-2': colors[1],
          '--aurora-3': colors[2],
          '--aurora-4': colors[3] || colors[0],
        } as React.CSSProperties}
      />
      <div 
        className="aurora-blob aurora-blob-3"
        style={{ 
          '--aurora-1': colors[0],
          '--aurora-2': colors[1],
          '--aurora-3': colors[2],
          '--aurora-4': colors[3] || colors[0],
        } as React.CSSProperties}
      />
      <div 
        className="aurora-blob aurora-blob-4"
        style={{ 
          '--aurora-1': colors[0],
          '--aurora-2': colors[1],
          '--aurora-3': colors[2],
          '--aurora-4': colors[3] || colors[0],
        } as React.CSSProperties}
      />
    </>
  );
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const { getCurrentBackground, config } = useWallpaperConfig();
  const [background, setBackground] = React.useState<string>('');
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    setBackground(getCurrentBackground());
    setIsInitialized(true);
  }, [getCurrentBackground]);

  const isAurora = background.startsWith('aurora:');
  const auroraPresetId = isAurora ? background.replace('aurora:', '') : null;
  const auroraPreset = auroraPresetId ? getAuroraPreset(auroraPresetId) : null;

  const overlayStyle: React.CSSProperties = {
    '--overlay-opacity': config.opacity / 100,
    '--overlay-blur': `${config.blur}px`,
    '--overlay-brightness': config.brightness / 100,
    '--overlay-saturation': config.saturation / 100,
    '--aurora-intensity': config.auroraIntensity / 100,
    '--aurora-speed': `${config.auroraSpeed}s`,
  } as React.CSSProperties;

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50",
        "data-[state=open]:animate-glass-overlay",
        "data-[state=closed]:animate-glass-exit",
        className,
      )}
      style={{
        ...overlayStyle,
        background: isAurora && auroraPreset && isInitialized
          ? undefined
          : background && !isAurora && isInitialized
            ? `url(${background}) center/cover`
            : undefined,
        filter: isInitialized
          ? `brightness(var(--overlay-brightness)) saturate(var(--overlay-saturation))`
          : undefined,
      }}
      {...props}
    >
      {isAurora && auroraPreset && isInitialized && (
        <div 
          className="absolute inset-0 aurora-background"
          style={{
            background: `linear-gradient(135deg, ${auroraPreset.colors[0]}${Math.round(config.auroraIntensity * 0.5)} 0%, ${auroraPreset.colors[1]}${Math.round(config.auroraIntensity * 0.6)} 50%, ${auroraPreset.colors[2]}${Math.round(config.auroraIntensity * 0.5)} 100%)`,
          }}
        />
      )}
      <div 
        className="absolute inset-0 backdrop-blur-xl backdrop-saturate-[1.8]"
        style={{ background: `rgba(0,0,0,${1 - config.opacity / 100})` }}
      />
      {isAurora && auroraPreset && isInitialized && (
        <AuroraAnimation colors={auroraPreset.colors} speed={config.auroraSpeed} intensity={config.auroraIntensity} />
      )}
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50",
        "w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
        "bg-gradient-to-br from-background/95 via-background/90 to-background/80",
        "backdrop-blur-2xl backdrop-saturate-180",
        "border border-white/20 dark:border-white/10",
        "rounded-2xl",
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "duration-200",
        "data-[state=open]:animate-dialog-enter",
        "data-[state=closed]:animate-dialog-exit",
        "p-6",
        className,
      )}
      {...props}
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl pointer-events-none",
        "bg-gradient-to-br from-white/5 via-transparent to-transparent",
      )} />
      {children}
      <DialogPrimitive.Close className={cn(
        "absolute right-4 top-4 rounded-xl",
        "p-2 opacity-70 ring-offset-background",
        "transition-all duration-200",
        "hover:opacity-100 hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none",
        "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      )}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
