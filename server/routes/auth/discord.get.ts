import { sanitizeRedirect, POST_LOGIN_REDIRECT_COOKIE } from '~~/shared/utils/redirect'

// OAuth Discord. Le chemin de la route (`/auth/discord`) détermine l'URI de
// redirection à enregistrer côté Discord Developer Portal.
export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'email'],
  },
  async onSuccess(event, { user }) {
    const sessionUser = await upsertUser({
      provider: 'discord',
      providerUserId: String(user.id),
      email: user.email ?? null,
      name: user.global_name ?? user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null,
    })
    // On ne stocke pas le token du provider : la session est autonome (meilleur offline).
    await setUserSession(event, { user: sessionUser, loggedInAt: Date.now() })
    // Retour à la destination voulue avant login (cookie posé par /login), sinon défaut.
    const redirectTo = sanitizeRedirect(getCookie(event, POST_LOGIN_REDIRECT_COOKIE))
    deleteCookie(event, POST_LOGIN_REDIRECT_COOKIE, { path: '/' })
    return sendRedirect(event, redirectTo)
  },
  onError(event, error) {
    console.error('[auth/discord] OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
