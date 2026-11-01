<?php

namespace App\Controller;

use App\Form\ContactType;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(MAILER_DSN)%')]
        private readonly string $mailerDsn,
        // Expéditeur Brevo validé (un From Gmail est accepté par l’API puis rejeté à la livraison)
        #[Autowire('%mail_from_address%')]
        private readonly string $mailFromAddress,
        #[Autowire('%mail_to_address%')]
        private readonly string $mailToAddress,
    ) {
    }

    #[Route('/', name: 'app_home')]
    public function index(
        Request $request,
        MailerInterface $mailer,
        LoggerInterface $logger,
    ): Response {
        $form = $this->createForm(ContactType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var array{name: string, email: string, company?: string, need: string, budget: string, message: string, website?: string} $data */
            $data = $form->getData();

            // Honeypot rempli = bot
            if (!empty($data['website'])) {
                $this->addFlash('success', 'Merci, votre message a bien été envoyé.');

                return $this->redirect($this->generateUrl('app_home').'#contact');
            }

            $needLabels = [
                'crm' => 'CRM & automatisations',
                'maintenance' => 'Maintenance web / mobile',
                'app' => 'App web ou mobile sur-mesure',
                'autre' => 'Autre',
            ];
            $budgetLabels = [
                'a_definir' => 'À définir ensemble',
                'lt_1k' => 'Moins de 1 000 €',
                '1_3k' => '1 000 – 3 000 €',
                '3_8k' => '3 000 – 8 000 €',
                'gt_8k' => 'Plus de 8 000 €',
            ];

            $body = sprintf(
                "Nouveau contact DWG\n\nNom: %s\nEmail: %s\nEntreprise: %s\nBesoin: %s\nBudget: %s\n\nMessage:\n%s\n",
                $data['name'],
                $data['email'],
                $data['company'] ?: '—',
                $needLabels[$data['need']] ?? $data['need'],
                $budgetLabels[$data['budget']] ?? $data['budget'],
                $data['message']
            );

            // Toujours archiver localement (filet de secours + historique)
            $this->archiveContact($body, $data['email']);

            $sent = false;
            $mailDisabled = str_starts_with($this->mailerDsn, 'null://');

            if (!$mailDisabled) {
                try {
                    $emailMessage = (new Email())
                        ->from(new Address($this->mailFromAddress, 'DWG Contact'))
                        ->replyTo(new Address($data['email'], $data['name']))
                        ->to($this->mailToAddress)
                        ->subject(sprintf('[DWG] %s — %s', $data['name'], $needLabels[$data['need']] ?? 'Contact'))
                        ->text($body);

                    $mailer->send($emailMessage);
                    $sent = true;
                } catch (\Throwable $e) {
                    $logger->error('Contact mail failed: '.$e->getMessage(), ['exception' => $e]);
                }
            } else {
                $logger->warning('Contact received but MAILER_DSN is null:// — email not sent, archived in var/contact.');
            }

            if ($sent) {
                $this->addFlash(
                    'success',
                    'Merci '.$data['name'].' — votre message est bien parti. Réponse sous 24–48 h ouvrées.'
                );
            } else {
                $this->addFlash(
                    'warning',
                    'Votre demande a bien été enregistrée, mais l’envoi email a échoué. On vous recontactera dès que possible, ou écrivez à developpeur.web.gard@gmail.com.'
                );
            }

            return $this->redirect($this->generateUrl('app_home').'#contact');
        }

        return $this->render('home/index.html.twig', [
            'contactForm' => $form->createView(),
        ]);
    }

    private function archiveContact(string $body, string $email): void
    {
        $fallbackDir = $this->getParameter('kernel.project_dir').'/var/contact';
        if (!is_dir($fallbackDir)) {
            @mkdir($fallbackDir, 0775, true);
        }

        $safeEmail = preg_replace('/[^a-z0-9_-]+/i', '-', $email) ?: 'unknown';
        $file = $fallbackDir.'/'.date('Y-m-d_His').'_'.$safeEmail.'.txt';
        @file_put_contents($file, $body);
    }
}
