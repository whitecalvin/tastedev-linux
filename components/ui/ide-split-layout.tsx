'use client';

import {Children, Fragment, isValidElement, useEffect, useRef, useState, type ReactNode, type PointerEvent} from 'react';
import {useLanguage} from '../language-provider';

// Package explorers use a direct <aside> child; the remaining pane fills the IDE.
export default function IdeSplitLayout({children}: {children: ReactNode}) {
  const {t} = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{id: number; x: number; width: number; direction: number} | null>(null);
  const [width, setWidth] = useState(260);
  const [dragging, setDragging] = useState(false);
  const [maximum, setMaximum] = useState(640);

  function bounds() {
    const available = container.current?.clientWidth || 905;
    return {min: Math.min(160, Math.max(80, available / 3)), max: Math.max(80, Math.min(640, available - 245))};
  }
  function resize(next: number) {
    const {min, max} = bounds();
    setWidth(Math.round(Math.max(Math.min(min, max), Math.min(max, next))));
  }
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const {min, max} = bounds();
      setMaximum(max);
      setWidth(current => Math.round(Math.max(Math.min(min, max), Math.min(max, current))));
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const separator = <div
    className="ide-pane-resizer"
    role="separator"
    aria-label={t('트리뷰 너비 조절')}
    aria-orientation="vertical"
    aria-valuemin={Math.min(160, maximum)}
    aria-valuemax={maximum}
    aria-valuenow={width}
    tabIndex={0}
    title={t('드래그하여 너비 조절 · 두 번 클릭하여 기본 너비')}
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      if (!container.current) return;
      const panel = container.current.querySelector<HTMLElement>(':scope > aside');
      if (!panel) return;
      drag.current = {id: event.pointerId, x: event.clientX, width: panel.getBoundingClientRect().width, direction: getComputedStyle(container.current).direction === 'rtl' ? -1 : 1};
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }}
    onPointerMove={event => {
      if (drag.current?.id !== event.pointerId) return;
      resize(drag.current.width + (event.clientX - drag.current.x) * drag.current.direction);
    }}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={() => {drag.current = null; setDragging(false);}}
    onDoubleClick={() => resize(260)}
    onKeyDown={event => {
      const rtl = container.current ? getComputedStyle(container.current).direction === 'rtl' : false;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      resize(event.key === 'Home' ? bounds().min : event.key === 'End' ? bounds().max : width + (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1) * (event.shiftKey ? 40 : 10));
    }}
  />;

  return <div ref={container} className="nginx-tree-layout ide-split-layout" data-resizing={dragging} style={{gridTemplateColumns: `minmax(0, ${width}px) 5px minmax(0, 1fr)`}}>
    {Children.map(children, child => isValidElement(child) && child.type === 'aside' ? <Fragment>{child}{separator}</Fragment> : child)}
  </div>;
}
