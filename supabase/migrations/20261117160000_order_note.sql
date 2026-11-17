-- Précisions laissées par le client dans le panier (prénom à inscrire, date, couleurs…).
alter table public.orders add column if not exists customer_note text check (char_length(customer_note) <= 1000);
