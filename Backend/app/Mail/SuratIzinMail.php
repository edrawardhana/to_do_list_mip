<?php

namespace App\Mail;

use App\Models\Exception as InternException;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SuratIzinMail extends Mailable
{
    use Queueable, SerializesModels;

    public $exception;
    public $user;
    public $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct(InternException $exception, $user, $pdfContent)
    {
        $this->exception = $exception;
        $this->user = $user;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Surat Izin Magang Disetujui - ' . $this->user->full_name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.surat_izin_approved',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, 'Surat_Izin_' . str_replace(' ', '_', $this->user->full_name) . '_' . $this->exception->permission_date->format('Y-m-d') . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
