<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * En-têtes de sécurité sur les réponses PHP.
 * Le nginx du dépôt masque la version (server_tokens) et X-Powered-By ;
 * Caddy, devant, se contente de transmettre ces en-têtes.
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire('%kernel.debug%')]
        private readonly bool $debug,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onResponse',
        ];
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        if (!headers_sent()) {
            header_remove('X-Powered-By');
        }

        $headers = $event->getResponse()->headers;
        $headers->remove('X-Powered-By');
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'SAMEORIGIN');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $secure = $event->getRequest()->isSecure();
        if ($secure) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        if (!$this->debug) {
            $headers->set('Content-Security-Policy', $this->contentSecurityPolicy($secure));
        }
    }

    private function contentSecurityPolicy(bool $upgradeInsecureRequests): string
    {
        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
            "img-src 'self' data:",
            "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        ];

        if ($upgradeInsecureRequests) {
            $directives[] = 'upgrade-insecure-requests';
        }

        return implode('; ', $directives);
    }
}
