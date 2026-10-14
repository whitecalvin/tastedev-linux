import type {PageSearchParams} from '../lib/page-session.ts';
export type SearchParams = PageSearchParams;
export type SearchPageProps = { searchParams: Promise<SearchParams> };
export type PackagePageProps = SearchPageProps & { params: Promise<{ package: string }> };
