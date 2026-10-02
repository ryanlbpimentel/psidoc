export type ApiSource = 'real' | 'mock'

// Quem está respondendo cada grupo de rotas (definido uma vez, na abertura do app).
let sources: Record<string, ApiSource> = {}

export const setApiSources = (next: Record<string, ApiSource>) => {
  sources = next
}

export const getApiSources = () => sources

/** true se pelo menos um grupo de rotas ainda está respondendo com dados de demonstração. */
export const isUsingMock = () => Object.values(sources).includes('mock')
