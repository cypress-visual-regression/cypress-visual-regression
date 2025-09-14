export interface CurrentTest {
    title: string;
    titlePath: string[];
}

export interface Spec {
    name: string;
    relative: string;
    absolute: string;
}

export function getFileName(test: CurrentTest, spec: Spec): string;
