import { sanitizeRedirect, POST_LOGIN_REDIRECT_COOKIE } from '~~/shared/utils/redirect'

// OAuth Google. Le chemin de la route (`/auth/google`) détermine l'URI de
// redirection à enregistrer côté Google Cloud Console.
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile', 'openid'],
  },
  async onSuccess(event, { user }) {
    const sessionUser = await upsertUser({
      provider: 'google',
      providerUserId: user.sub,
      email: user.email ?? null,
      name: user.name ?? user.email ?? 'Utilisateur',
      avatar: user.picture ?? null,
    })
    // On ne stocke pas le token du provider : la session est autonome (meilleur offline).
    await setUserSession(event, { user: sessionUser, loggedInAt: Date.now() })
    // Retour à la destination voulue avant login (cookie posé par /login), sinon défaut.
    const redirectTo = sanitizeRedirect(getCookie(event, POST_LOGIN_REDIRECT_COOKIE))
    deleteCookie(event, POST_LOGIN_REDIRECT_COOKIE, { path: '/' })
    return sendRedirect(event, redirectTo)
  },
  onError(event, error) {
    console.error('[auth/google] OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
