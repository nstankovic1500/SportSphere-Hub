import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = join(process.cwd(), 'src', 'app', 'components');

const replacements = [
  ['Unable to load home page.', 'Nije moguće učitati početnu stranicu.'],
  ['Unable to load filters.', 'Nije moguće učitati filtere.'],
  ['Unable to load facilities.', 'Nije moguće učitati objekte.'],
  ['Unable to load sports.', 'Nije moguće učitati sportove.'],
  ['Unable to load facility details.', 'Nije moguće učitati detalje objekta.'],
  ['Unable to load reviews.', 'Nije moguće učitati recenzije.'],
  ['Review submitted successfully.', 'Recenzija je uspešno poslata.'],
  ['Unable to submit review.', 'Nije moguće poslati recenziju.'],
  ['You are blocked in this facility and cannot create new reservations or training appointments.', 'Blokirani ste u ovom objektu i ne možete kreirati nove rezervacije ili treninge.'],
  ['Unable to load registration requests.', 'Nije moguće učitati zahteve za registraciju.'],
  ['Unable to load facility requests.', 'Nije moguće učitati zahteve za objekte.'],
  ['Unable to cancel training appointment.', 'Nije moguće otkazati termin treninga.'],
  ['Unable to load training history.', 'Nije moguće učitati istoriju treninga.'],
  ['Cancel order ', 'Otkaži porudžbinu '],
  ['Unable to cancel order.', 'Nije moguće otkazati porudžbinu.'],
  ['Unable to load orders.', 'Nije moguće učitati porudžbine.'],
  ['Unable to create reservation.', 'Nije moguće kreirati rezervaciju.'],
  ['Reserved', 'Rezervisano'],
  ['Unable to load calendar availability.', 'Nije moguće učitati dostupnost kalendara.'],
  ['Availability is not loaded for the selected day.', 'Dostupnost nije učitana za izabrani datum.'],
  ['Reservation must start and end on the same date.', 'Rezervacija mora početi i završiti se istog datuma.'],
  ['Reservation must start and end on full hours.', 'Rezervacija mora početi i završiti se punim satima.'],
  ['Reservation must last at least 1 hour.', 'Rezervacija mora trajati najmanje 1 sat.'],
  ['Reservation must be in the future.', 'Rezervacija mora biti u budućnosti.'],
  ['Reservation must stay inside facility opening hours.', 'Rezervacija mora biti unutar radnog vremena objekta.'],
  ['Reservation overlaps an occupied interval.', 'Rezervacija se preklapa sa zauzetim terminom.'],
  ['Unable to load trainer filters.', 'Nije moguće učitati filtere trenera.'],
  ['Unable to load trainers.', 'Nije moguće učitati trenere.'],
  ['Unable to update cart item.', 'Nije moguće ažurirati stavku u korpi.'],
  ['Unable to remove cart item.', 'Nije moguće ukloniti stavku iz korpe.'],
  ['Unable to complete checkout.', 'Nije moguće završiti kupovinu.'],
  ['Unable to load cart.', 'Nije moguće učitati korpu.'],
  ['Unable to save trainer.', 'Nije moguće sačuvati trenera.'],
  ['Trainer updated successfully.', 'Trener je uspešno ažuriran.'],
  ['Trainer created successfully.', 'Trener je uspešno kreiran.'],
  ['Unable to load trainer form.', 'Nije moguće učitati formu trenera.'],
  ['Delete trainer ', 'Obriši trenera '],
  ['Unable to delete trainer.', 'Nije moguće obrisati trenera.'],
  ['Unable to load employee facilities.', 'Nije moguće učitati objekte zaposlenog.'],
  ['Unable to load attendance items.', 'Nije moguće učitati stavke prisustva.'],
  ['Unable to update attendance.', 'Nije moguće ažurirati prisustvo.'],
  ['Unable to save product.', 'Nije moguće sačuvati proizvod.'],
  ['Unable to load product form.', 'Nije moguće učitati formu proizvoda.'],
  ['Product updated successfully.', 'Proizvod je uspešno ažuriran.'],
  ['Product created successfully.', 'Proizvod je uspešno kreiran.'],
  ['Profile updated successfully.', 'Profil je uspešno ažuriran.'],
  ['Profile image updated successfully.', 'Profilna slika je uspešno ažurirana.'],
  ['Unable to upload profile image.', 'Nije moguće otpremiti profilnu sliku.'],
  ['Unable to update employee profile.', 'Nije moguće ažurirati profil zaposlenog.'],
  ['Unable to load employee profile.', 'Nije moguće učitati profil zaposlenog.'],
  ['Unable to delete product.', 'Nije moguće obrisati proizvod.'],
  ['Unable to save promotion.', 'Nije moguće sačuvati promociju.'],
  ['Unable to load promotion form.', 'Nije moguće učitati formu promocije.'],
  ['Unable to delete promotion.', 'Nije moguće obrisati promociju.'],
  ['Unable to load promotions.', 'Nije moguće učitati promocije.'],
  ['Unable to add item to cart.', 'Nije moguće dodati stavku u korpu.'],
  ['Unable to delete resource.', 'Nije moguće obrisati resurs.'],
  ['Unable to load resources.', 'Nije moguće učitati resurse.'],
  ['Resource updated successfully.', 'Resurs je uspešno ažuriran.'],
  ['Resource created successfully.', 'Resurs je uspešno kreiran.'],
  ['Unable to save resource.', 'Nije moguće sačuvati resurs.'],
  ['Unable to load resource form.', 'Nije moguće učitati formu resursa.'],
  ['Unable to update profile.', 'Nije moguće ažurirati profil.'],
  ['Unable to cancel reservation.', 'Nije moguće otkazati rezervaciju.'],
  ['Unable to load athlete profile.', 'Nije moguće učitati profil sportiste.'],
  ['Unable to move calendar event.', 'Nije moguće pomeriti događaj u kalendaru.'],
  ['Unable to load calendar.', 'Nije moguće učitati kalendar.'],
  ['Unable to load facility resources.', 'Nije moguće učitati resurse objekta.'],
  ['Unable to send apply request.', 'Nije moguće poslati prijavu.'],
  ['Unable to close ad.', 'Nije moguće zatvoriti oglas.'],
  ['Unable to load ad filters.', 'Nije moguće učitati filtere oglasa.'],
  ['Unable to load ads.', 'Nije moguće učitati oglase.'],
  ['Unable to update order status.', 'Nije moguće ažurirati status porudžbine.'],
];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!fullPath.endsWith('.ts')) {
      continue;
    }
    let content = readFileSync(fullPath, 'utf8');
    for (const [from, to] of replacements) {
      content = content.replaceAll(`'${from}'`, `'${to}'`);
      content = content.replaceAll(`"${from}"`, `"${to}"`);
      content = content.replaceAll(`\`${from}\``, `\`${to}\``);
    }
    writeFileSync(fullPath, content, 'utf8');
  }
};

walk(rootDir);
