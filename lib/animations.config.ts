// Configuração centralizada de animações
// Mantém consistência visual em todo o sistema

export const animationConfig = {
  // Durações (em segundos)
  durations: {
    fast: 0.15,      // Feedback imediato (spinners, ícones)
    normal: 0.35,    // Transições padrão (fade, slide)
    slow: 0.6,       // Transições longas (page transitions)
    skeleton: 1.5,   // Shimmer do skeleton
  },

  // Easing functions (Framer Motion cubic-bezier)
  easings: {
    // Spring feel (padrão recomendado)
    spring: [0.16, 1, 0.3, 1] as const,

    // Linear (para animações contínuas)
    linear: [0, 0, 1, 1] as const,

    // Ease in-out
    inOut: [0.4, 0, 0.2, 1] as const,
  },

  // Transições de página
  pageTransition: {
    enter: { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    duration: 0.35,
  },

  // Skeleton shimmer
  skeletonShimmer: {
    duration: 1.5,
    repeat: Infinity,
    backgroundColor: "hsl(var(--skeleton-bg))",
    backgroundImage: "linear-gradient(90deg, hsl(var(--skeleton-bg)), hsl(var(--skeleton-shimmer)), hsl(var(--skeleton-bg)))",
    backgroundSize: "200% 100%",
  },

  // Stagger para listas
  stagger: {
    itemDelay: 0.08,
    containerDelay: 0.1,
  },

  // Hover states
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },

  tap: {
    scale: 0.98,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
} as const;

// Variantes padrão reutilizáveis
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: animationConfig.durations.normal,
      ease: animationConfig.easings.spring,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: animationConfig.durations.fast,
    },
  },
};

export const slideUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.durations.normal,
      ease: animationConfig.easings.spring,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: animationConfig.durations.fast,
    },
  },
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: animationConfig.durations.normal,
      ease: animationConfig.easings.spring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: animationConfig.durations.fast,
    },
  },
};
