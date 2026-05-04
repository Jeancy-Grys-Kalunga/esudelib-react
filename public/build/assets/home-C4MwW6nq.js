import { j as e, L as h, $ as i, r as l, K as m } from './app-cNltzKGK.js';
const n = ({ className: t = 'w-6 h-6' }) =>
        e.jsxs('svg', {
            className: t,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [e.jsx('path', { d: 'M22 10v6M2 10l10-5 10 5-10 5z' }), e.jsx('path', { d: 'M6 12v5c3 3 9 3 12 0v-5' })],
        }),
    u = ({ className: t = 'w-6 h-6' }) =>
        e.jsxs('svg', {
            className: t,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [
                e.jsx('path', { d: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' }),
                e.jsx('polyline', { points: '10 17 15 12 10 7' }),
                e.jsx('line', { x1: '15', y1: '12', x2: '3', y2: '12' }),
            ],
        }),
    o = ({ className: t = 'w-6 h-6' }) =>
        e.jsxs('svg', {
            className: t,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [e.jsx('path', { d: 'M5 12h14' }), e.jsx('path', { d: 'm12 5 7 7-7 7' })],
        }),
    p = ({ className: t = 'w-6 h-6' }) =>
        e.jsxs('svg', {
            className: t,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [e.jsx('circle', { cx: '12', cy: '12', r: '10' }), e.jsx('path', { d: 'M12 16v-4' }), e.jsx('path', { d: 'M12 8h.01' })],
        }),
    b = ({ className: t = 'w-6 h-6' }) =>
        e.jsxs('svg', {
            className: t,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [
                e.jsx('path', {
                    d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
                }),
                e.jsx('path', { d: 'M5 3v4' }),
                e.jsx('path', { d: 'M19 17v4' }),
                e.jsx('path', { d: 'M3 5h4' }),
                e.jsx('path', { d: 'M17 19h4' }),
            ],
        });
function g() {
    const { auth: t } = m().props,
        [s, d] = l.useState({ x: 0, y: 0 }),
        [c, x] = l.useState(!1);
    return (
        l.useEffect(() => {
            x(!0);
            const a = (r) => {
                d({ x: (r.clientX / window.innerWidth - 0.5) * 40, y: (r.clientY / window.innerHeight - 0.5) * 40 });
            };
            return window.addEventListener('mousemove', a), () => window.removeEventListener('mousemove', a);
        }, []),
        e.jsxs(e.Fragment, {
            children: [
                e.jsx(h, { title: 'Accueil - E-CURSUSs LMD' }),
                e.jsxs('div', {
                    className: `flex min-h-screen bg-white transition-opacity duration-1000 ${c ? 'opacity-100' : 'opacity-0'}`,
                    children: [
                        e.jsxs('div', {
                            className: 'relative hidden w-full flex-col justify-between overflow-hidden lg:flex lg:w-1/2',
                            children: [
                                e.jsxs('div', {
                                    className: 'absolute inset-0 bg-[#0a0f2c]',
                                    children: [
                                        e.jsx('div', {
                                            className:
                                                'absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0f2c] to-[#0a0f2c]',
                                        }),
                                        e.jsx('div', {
                                            className:
                                                'absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/60 via-transparent to-transparent',
                                        }),
                                        e.jsx('div', {
                                            className:
                                                "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 [mask-image:linear-gradient(to_bottom_right,white,transparent)]",
                                        }),
                                    ],
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 mix-blend-screen blur-[100px] transition-transform duration-1000 ease-out',
                                    style: { transform: `translate(${s.x}px, ${s.y}px)` },
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute top-[40%] -right-[20%] h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-500/20 mix-blend-screen blur-[100px] transition-transform duration-1000 ease-out',
                                    style: { transform: `translate(${-s.x}px, ${-s.y}px)` },
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-sky-500/15 mix-blend-screen blur-[100px] transition-transform duration-1000 ease-out',
                                    style: { transform: `translate(${s.x * 0.5}px, ${s.y * 0.5}px)` },
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute top-[15%] right-[15%] h-64 w-64 animate-[spin_60s_linear_infinite] rounded-full border border-white/5 opacity-50 shadow-[0_0_100px_rgba(255,255,255,0.05)] backdrop-blur-3xl',
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute bottom-[20%] left-[10%] h-96 w-96 animate-[spin_40s_linear_infinite_reverse] rounded-full border border-white/5 opacity-30 shadow-[0_0_100px_rgba(59,130,246,0.1)] backdrop-blur-3xl',
                                }),
                                e.jsx('div', {
                                    className:
                                        'absolute top-1/4 right-1/4 flex h-24 w-24 rotate-12 animate-[bounce_8s_infinite] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 opacity-60 backdrop-blur-md',
                                    children: e.jsx(b, { className: 'h-10 w-10 text-blue-300' }),
                                }),
                                e.jsxs('div', {
                                    className: 'relative z-10 flex h-full flex-col p-12 lg:p-16',
                                    children: [
                                        e.jsxs('div', {
                                            className: 'flex w-fit items-center gap-4 transition-transform duration-300 hover:scale-[1.02]',
                                            children: [
                                                e.jsxs('div', {
                                                    className:
                                                        'relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl',
                                                    children: [
                                                        e.jsx('div', {
                                                            className:
                                                                'absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-400/20 to-transparent opacity-50',
                                                        }),
                                                        e.jsx(n, { className: 'relative z-10 h-8 w-8 text-white drop-shadow-md' }),
                                                    ],
                                                }),
                                                e.jsx('span', {
                                                    className: 'bg-clip-text text-3xl font-black tracking-tight text-white drop-shadow-sm',
                                                    children: 'E-CURSUSs LMD',
                                                }),
                                            ],
                                        }),
                                        e.jsxs('div', {
                                            className: 'flex flex-grow flex-col justify-center space-y-12',
                                            children: [
                                                e.jsxs('div', {
                                                    className: 'space-y-6',
                                                    children: [
                                                        e.jsxs('div', {
                                                            className:
                                                                'group inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md transition-colors hover:bg-blue-500/20',
                                                            children: [
                                                                e.jsxs('span', {
                                                                    className: 'relative flex h-2.5 w-2.5',
                                                                    children: [
                                                                        e.jsx('span', {
                                                                            className:
                                                                                'absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75',
                                                                        }),
                                                                        e.jsx('span', {
                                                                            className: 'relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400',
                                                                        }),
                                                                    ],
                                                                }),
                                                                e.jsx('span', {
                                                                    className: 'ml-3 text-sm font-semibold tracking-wider text-blue-100 uppercase',
                                                                    children: 'Plateforme officielle RDC',
                                                                }),
                                                            ],
                                                        }),
                                                        e.jsxs('h1', {
                                                            className: 'text-5xl leading-[1.1] font-black text-white lg:text-[4.5rem]',
                                                            children: [
                                                                "L'avenir",
                                                                e.jsx('br', {}),
                                                                e.jsx('span', {
                                                                    className:
                                                                        'bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent',
                                                                    children: 'académique',
                                                                }),
                                                                e.jsx('br', {}),
                                                                'simplifié.',
                                                            ],
                                                        }),
                                                        e.jsx('p', {
                                                            className: 'max-w-lg text-xl leading-relaxed font-medium text-blue-100/80 drop-shadow-sm',
                                                            children:
                                                                'Une plateforme de nouvelle génération pour gérer le système Licence-Master-Doctorat avec élégance et performance.',
                                                        }),
                                                    ],
                                                }),
                                                e.jsx('div', {
                                                    className: 'grid grid-cols-2 gap-5 pt-8',
                                                    children: [
                                                        { label: 'ÉTUDIANTS', value: '12.5k+', delay: '0ms' },
                                                        { label: 'ENSEIGNANTS', value: '350+', delay: '100ms' },
                                                        { label: 'DÉPARTEMENTS', value: '45', delay: '200ms' },
                                                        { label: 'SATISFACTION', value: '98%', delay: '300ms' },
                                                    ].map((a, r) =>
                                                        e.jsxs(
                                                            'div',
                                                            {
                                                                className:
                                                                    'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
                                                                style: { animationDelay: a.delay },
                                                                children: [
                                                                    e.jsx('div', {
                                                                        className:
                                                                            'absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                                                                    }),
                                                                    e.jsx('p', {
                                                                        className: 'relative z-10 text-4xl font-black text-white drop-shadow-sm',
                                                                        children: a.value,
                                                                    }),
                                                                    e.jsx('p', {
                                                                        className:
                                                                            'relative z-10 mt-2 text-xs font-bold tracking-widest text-blue-300/80 uppercase',
                                                                        children: a.label,
                                                                    }),
                                                                ],
                                                            },
                                                            r,
                                                        ),
                                                    ),
                                                }),
                                            ],
                                        }),
                                        e.jsxs('div', {
                                            className: 'mt-auto flex items-center justify-between border-t border-white/10 pt-8',
                                            children: [
                                                e.jsxs('div', {
                                                    className: 'flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100',
                                                    children: [
                                                        e.jsx('div', { className: 'h-px w-8 bg-blue-300/50' }),
                                                        e.jsx('p', {
                                                            className: 'text-xs font-bold tracking-widest text-blue-100 uppercase',
                                                            children: "Ministère de l'ESU",
                                                        }),
                                                    ],
                                                }),
                                                e.jsxs('div', {
                                                    className: 'flex gap-2',
                                                    children: [
                                                        e.jsx('div', { className: 'h-2 w-2 rounded-full bg-white/20' }),
                                                        e.jsx('div', { className: 'h-2 w-8 rounded-full bg-blue-500' }),
                                                        e.jsx('div', { className: 'h-2 w-2 rounded-full bg-white/20' }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        e.jsxs('div', {
                            className:
                                'relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] p-6 sm:p-12 lg:w-1/2 lg:p-24',
                            children: [
                                e.jsx('div', {
                                    className:
                                        "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]",
                                }),
                                e.jsx('div', {
                                    className:
                                        'pointer-events-none absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-blue-100/60 blur-[80px]',
                                }),
                                e.jsx('div', {
                                    className:
                                        'pointer-events-none absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/4 translate-y-1/3 rounded-full bg-indigo-50/60 blur-[100px]',
                                }),
                                e.jsxs('div', {
                                    className: 'relative z-10 w-full max-w-[460px] space-y-12',
                                    children: [
                                        e.jsxs('div', {
                                            className: 'mb-12 flex items-center justify-center gap-4 lg:hidden',
                                            children: [
                                                e.jsx('div', {
                                                    className:
                                                        'flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a0f2c] text-white shadow-2xl shadow-blue-900/20',
                                                    children: e.jsx(n, { className: 'h-8 w-8' }),
                                                }),
                                                e.jsx('span', {
                                                    className: 'text-3xl font-black tracking-tight text-slate-900',
                                                    children: 'E-CURSUSs',
                                                }),
                                            ],
                                        }),
                                        e.jsxs('div', {
                                            className: 'space-y-4 text-center lg:text-left',
                                            children: [
                                                e.jsx('h2', {
                                                    className: 'text-4xl font-black tracking-tight text-slate-900',
                                                    children: 'Espace privé',
                                                }),
                                                e.jsx('p', {
                                                    className: 'text-lg font-medium text-slate-500',
                                                    children: 'Identifiez-vous pour accéder à votre espace de travail personnel et sécurisé.',
                                                }),
                                            ],
                                        }),
                                        e.jsx('div', {
                                            className: 'space-y-6',
                                            children: t.user
                                                ? e.jsxs('div', {
                                                      className: 'group relative space-y-4',
                                                      children: [
                                                          e.jsx('div', {
                                                              className:
                                                                  'absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200',
                                                          }),
                                                          e.jsxs('div', {
                                                              className:
                                                                  'relative rounded-2xl border border-white/50 bg-white/70 p-10 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl',
                                                              children: [
                                                                  e.jsx('div', {
                                                                      className:
                                                                          'mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 text-blue-600 shadow-inner ring-4 ring-white',
                                                                      children: e.jsx('span', {
                                                                          className: 'text-4xl font-black',
                                                                          children: t.user.name.charAt(0).toUpperCase(),
                                                                      }),
                                                                  }),
                                                                  e.jsxs('div', {
                                                                      className:
                                                                          'mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-600/20 ring-inset',
                                                                      children: [
                                                                          e.jsx('span', { className: 'h-1.5 w-1.5 rounded-full bg-emerald-500' }),
                                                                          'Connecté',
                                                                      ],
                                                                  }),
                                                                  e.jsx('h3', {
                                                                      className: 'mb-1 text-2xl font-bold text-slate-900',
                                                                      children: t.user.name,
                                                                  }),
                                                                  e.jsx('p', {
                                                                      className: 'mb-10 text-sm font-medium text-slate-500',
                                                                      children: t.user.email,
                                                                  }),
                                                                  e.jsxs(i, {
                                                                      href: route('dashboard'),
                                                                      className:
                                                                          'group/btn relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900 px-8 py-5 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98]',
                                                                      children: [
                                                                          e.jsxs('span', {
                                                                              className: 'relative z-10 flex items-center gap-2',
                                                                              children: [
                                                                                  'Aller au tableau de bord',
                                                                                  e.jsx(o, {
                                                                                      className:
                                                                                          'h-5 w-5 transition-transform group-hover/btn:translate-x-1',
                                                                                  }),
                                                                              ],
                                                                          }),
                                                                          e.jsx('div', {
                                                                              className:
                                                                                  'absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100',
                                                                          }),
                                                                      ],
                                                                  }),
                                                              ],
                                                          }),
                                                      ],
                                                  })
                                                : e.jsxs('div', {
                                                      className: 'mt-10 space-y-10',
                                                      children: [
                                                          e.jsxs('div', {
                                                              className: 'group relative',
                                                              children: [
                                                                  e.jsx('div', {
                                                                      className:
                                                                          'absolute -inset-[1px] rounded-[2rem] bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-20 blur-sm transition-opacity duration-500 group-hover:opacity-40',
                                                                  }),
                                                                  e.jsx('div', {
                                                                      className:
                                                                          'relative rounded-[2rem] bg-white p-2 shadow-2xl ring-1 shadow-slate-200/40 ring-slate-100',
                                                                      children: e.jsxs('div', {
                                                                          className: 'rounded-[1.5rem] bg-slate-50/50 p-8 sm:p-10',
                                                                          children: [
                                                                              e.jsxs('div', {
                                                                                  className: 'mb-10 flex items-center gap-6',
                                                                                  children: [
                                                                                      e.jsx('div', {
                                                                                          className:
                                                                                              'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 shadow-slate-200/50 ring-slate-100',
                                                                                          children: e.jsx(u, { className: 'h-8 w-8 text-blue-600' }),
                                                                                      }),
                                                                                      e.jsxs('div', {
                                                                                          children: [
                                                                                              e.jsx('h3', {
                                                                                                  className: 'text-xl font-bold text-slate-900',
                                                                                                  children: 'Accès Sécurisé',
                                                                                              }),
                                                                                              e.jsx('p', {
                                                                                                  className:
                                                                                                      'mt-1 text-sm font-medium text-slate-500',
                                                                                                  children: 'Connexion obligatoire',
                                                                                              }),
                                                                                          ],
                                                                                      }),
                                                                                  ],
                                                                              }),
                                                                              e.jsxs(i, {
                                                                                  href: route('login'),
                                                                                  className:
                                                                                      'group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 object-cover px-8 py-5 text-lg font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98]',
                                                                                  children: [
                                                                                      e.jsxs('span', {
                                                                                          className: 'relative z-10 flex items-center gap-3',
                                                                                          children: [
                                                                                              'Se connecter',
                                                                                              e.jsx('div', {
                                                                                                  className:
                                                                                                      'flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover/btn:translate-x-1 group-hover/btn:bg-white/30',
                                                                                                  children: e.jsx(o, { className: 'h-4 w-4' }),
                                                                                              }),
                                                                                          ],
                                                                                      }),
                                                                                      e.jsx('div', {
                                                                                          className:
                                                                                              'absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-600 via-indigo-600 to-slate-900 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100',
                                                                                      }),
                                                                                  ],
                                                                              }),
                                                                          ],
                                                                      }),
                                                                  }),
                                                              ],
                                                          }),
                                                          e.jsx('div', {
                                                              className: 'relative py-4',
                                                              children: e.jsx('div', {
                                                                  className: 'absolute inset-0 flex items-center',
                                                                  children: e.jsx('span', {
                                                                      className: 'w-full border-t border-dashed border-slate-200',
                                                                  }),
                                                              }),
                                                          }),
                                                          e.jsx('div', {
                                                              className:
                                                                  'group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50',
                                                              children: e.jsxs('div', {
                                                                  className: 'flex gap-4',
                                                                  children: [
                                                                      e.jsx('div', {
                                                                          className:
                                                                              'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-100',
                                                                          children: e.jsx(p, { className: 'h-5 w-5' }),
                                                                      }),
                                                                      e.jsxs('div', {
                                                                          children: [
                                                                              e.jsx('h4', {
                                                                                  className: 'mb-1.5 text-base font-bold text-slate-900',
                                                                                  children: "Vous n'avez pas de compte ?",
                                                                              }),
                                                                              e.jsx('p', {
                                                                                  className: 'text-sm leading-relaxed font-medium text-slate-500',
                                                                                  children:
                                                                                      "La création de compte est gérée au niveau institutionnel. Veuillez contacter l'administration de votre établissement pour obtenir vos accès.",
                                                                              }),
                                                                          ],
                                                                      }),
                                                                  ],
                                                              }),
                                                          }),
                                                      ],
                                                  }),
                                        }),
                                        e.jsx('div', {
                                            className: 'pt-20 text-center lg:hidden',
                                            children: e.jsx('p', {
                                                className: 'text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase',
                                                children: "Ministère de l'Enseignement Supérieur et Universitaire - RDC",
                                            }),
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        })
    );
}
g.layout = (t) => e.jsx(e.Fragment, { children: t });
export { g as default };
