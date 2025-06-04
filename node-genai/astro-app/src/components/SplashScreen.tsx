import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplashScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const shinyTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const textElement = textRef.current;
    const shinyElement = shinyTextRef.current;

    if (!container || !textElement || !shinyElement) return;

    // Split text into individual characters
    const text = 'Bienvenido a';
    const chars = text.split('').map((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(100px) rotateX(-90deg)';
      return span;
    });

    // Clear text element and add character spans
    textElement.innerHTML = '';
    chars.forEach((char) => textElement.appendChild(char));

    // Create timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Wait a bit before redirecting
        setTimeout(() => {
          window.location.href = '/main';
        }, 1000);
      },
    });

    // Initial container animation
    tl.set(container, { opacity: 1 })
      .from(container, {
        scale: 0.8,
        duration: 0.8,
        ease: 'back.out(1.7)',
      })
      // Animate characters in sequence
      .to(
        chars,
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.8,
          stagger: {
            amount: 1.5,
            from: 'start',
          },
          ease: 'back.out(1.7)',
        },
        '-=0.4'
      )
      // Add a subtle glow effect
      .to(
        textElement,
        {
          textShadow:
            '0 0 20px rgba(224,108,36, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)',
          duration: 0.5,
          ease: 'power2.inOut',
        },
        '-=0.5'
      )
      // Hold for a moment
      .to({}, { duration: 1.5 })
      // Fade out first text
      .to(textElement, {
        opacity: 0,
        y: -50,
        duration: 0.8,
        ease: 'power2.inOut',
      })
      // Show shiny text "Sorti.IA"
      .fromTo(
        shinyElement,
        {
          opacity: 0,
          y: 50,
          scale: 0.8,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'back.out(1.7)',
        },
        '-=0.3'
      )
      // Hold shiny text
      .to({}, { duration: 2 })
      // Fade out animation
      .to(container, {
        opacity: 0,
        scale: 1.1,
        duration: 0.8,
        ease: 'power2.inOut',
      });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 z-50 flex items-center justify-center bg-cover bg-center bg-no-repeat opacity-0'
      style={{
        backgroundImage: "url('/assets/Sorti_background.jpg')",
      }}
    >
      <div className='text-center relative z-10'>
        {/* First text: "bienvenido a" */}
        <div
          ref={textRef}
          className='text-5xl md:text-6xl lg:text-7xl font-bold text-green-800 mb-8'
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        ></div>

        {/* Second text: "Sorti.IA" with shiny effect */}
        <div
          ref={shinyTextRef}
          className='text-6xl md:text-7xl lg:text-8xl font-bold mb-8 opacity-0 shiny-text'
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          Sorti.IA
        </div>

        {/* Animated dots */}
        <div className='flex justify-center space-x-2 relative z-10'>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className='w-3 h-3 bg-green-500 rounded-full animate-pulse'
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
                backgroundColor: '#42C148', // Verde Sorti
              }}
            />
          ))}
        </div>
      </div>

      {/* Background particles effect */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='absolute w-1 h-1 bg-white rounded-full opacity-20'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.5;
          }
        }

        @keyframes shine {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .shiny-text {
          background: linear-gradient(
            45deg,
            #D4FD2B 0%,
            #42C148 25%,
            #13572F 50%,
            #0A2C18 75%,
            #D4FD2B 100%
          );
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 3s ease-in-out infinite;
          text-shadow: 
            0 0 30px rgba(255, 107, 107, 0.5),
            0 0 60px rgba(78, 205, 196, 0.3),
            0 0 100px rgba(69, 183, 209, 0.2);
        }

        @keyframes shine {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
