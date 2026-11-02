<?php

namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints as Assert;

class ContactType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'label' => 'Nom',
                'help' => 'Obligatoire — 120 caractères max.',
                'constraints' => [
                    new Assert\NotBlank(message: 'Indiquez votre nom.'),
                    new Assert\Length(max: 120, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.'),
                ],
                'attr' => [
                    'placeholder' => 'Votre nom',
                    'autocomplete' => 'name',
                    'maxlength' => 120,
                ],
            ])
            ->add('email', EmailType::class, [
                'label' => 'Email',
                'help' => 'Obligatoire — pour vous répondre.',
                'constraints' => [
                    new Assert\NotBlank(message: 'Indiquez votre email.'),
                    new Assert\Email(message: 'Email invalide.'),
                ],
                'attr' => [
                    'placeholder' => 'vous@entreprise.fr',
                    'autocomplete' => 'email',
                ],
            ])
            ->add('company', TextType::class, [
                'label' => 'Entreprise (optionnel)',
                'help' => 'Facultatif — 160 caractères max.',
                'required' => false,
                'constraints' => [
                    new Assert\Length(max: 160, maxMessage: 'Le nom d’entreprise ne peut pas dépasser {{ limit }} caractères.'),
                ],
                'attr' => [
                    'placeholder' => 'Nom de votre structure',
                    'autocomplete' => 'organization',
                    'maxlength' => 160,
                ],
            ])
            ->add('need', ChoiceType::class, [
                'label' => 'Besoin principal',
                'help' => 'Obligatoire — choisissez la catégorie la plus proche.',
                'placeholder' => 'Choisir…',
                'choices' => [
                    'Suivi clients, devis, relances' => 'crm',
                    'Maintenance site / app' => 'maintenance',
                    'App ou outil sur-mesure' => 'app',
                    'Autre / à préciser' => 'autre',
                ],
                'constraints' => [new Assert\NotBlank(message: 'Sélectionnez un besoin.')],
            ])
            ->add('budget', ChoiceType::class, [
                'label' => 'Budget indicatif',
                'help' => 'Obligatoire — une fourchette suffit, même approximative.',
                'placeholder' => 'Choisir…',
                'choices' => [
                    'À définir ensemble' => 'a_definir',
                    'Moins de 1 000 €' => 'lt_1k',
                    '1 000 – 3 000 €' => '1_3k',
                    '3 000 – 8 000 €' => '3_8k',
                    'Plus de 8 000 €' => 'gt_8k',
                ],
                'constraints' => [new Assert\NotBlank(message: 'Indiquez une fourchette.')],
            ])
            ->add('message', TextareaType::class, [
                'label' => 'Votre projet',
                'help' => 'Obligatoire — 20 caractères minimum, 4000 max.',
                'constraints' => [
                    new Assert\NotBlank(message: 'Décrivez brièvement votre besoin.'),
                    new Assert\Length(
                        min: 20,
                        max: 4000,
                        minMessage: 'Ajoutez un peu plus de détail ({{ limit }} caractères min.).',
                        maxMessage: 'Le message ne peut pas dépasser {{ limit }} caractères.',
                    ),
                ],
                'attr' => [
                    'placeholder' => 'Contexte, outil actuel, objectif, délai souhaité…',
                    'rows' => 5,
                    'minlength' => 20,
                    'maxlength' => 4000,
                    'data-char-counter-target' => 'contact-message',
                ],
            ])
            // Honeypot anti-spam
            ->add('website', TextType::class, [
                'label' => false,
                'required' => false,
                'mapped' => true,
                'attr' => [
                    'tabindex' => '-1',
                    'autocomplete' => 'off',
                    'aria-hidden' => 'true',
                    'class' => 'contact-honeypot',
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        // Jeton CSRF session (pas "submit" stateless) : pas besoin du JS AssetMapper/Stimulus.
        $resolver->setDefaults([
            'csrf_protection' => true,
            'csrf_token_id' => 'contact',
        ]);
    }
}
