// Augmentation des types de session nuxt-auth-utils.
// `user` ne contient que des données publiques (lisibles côté client).
declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    avatar: string | null
  }

  interface UserSession {
    loggedInAt?: number
  }
}

export {}
