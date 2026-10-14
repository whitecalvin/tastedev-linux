'use client';
import ConsoleLoadError from '../../components/console-load-error';
export default function ConsoleError({reset}: {error: Error & {digest?: string}; reset: () => void}){return <ConsoleLoadError retry={reset}/>;}
