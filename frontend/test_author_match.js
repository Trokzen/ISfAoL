// Тест функции isLikelyMyAuthor
const testFullName = "Яровой Роберт Владимирович";

const testAuthors = [
  "Яровой Р.В.",
  "Яровой Р.",
  "Яровой Роберт",
  "Яровой Роберт Владимирович",
  "Яровский Р.В.",  // не совпадает
  "Иванов А.С.",    // не совпадает
];

function isLikelyMyAuthor(authorName) {
  const userFullName = testFullName;
  
  if (!userFullName) return false;

  // Разбиваем ФИО на части
  const userParts = userFullName.trim().split(/\s+/);
  const lastName = userParts[0] || '';
  const firstName = userParts[1] || '';
  const patronymic = userParts[2] || '';

  // Разбиваем имя автора на части
  const authorParts = authorName.trim().split(/\s+/);
  const authorLastName = authorParts[0] || '';

  console.log('\n--- Проверка ---');
  console.log('User parts:', { lastName, firstName, patronymic });
  console.log('Author parts:', authorParts);

  // Сравниваем фамилии (регистронезависимо)
  if (lastName.toLowerCase() !== authorLastName.toLowerCase()) {
    console.log('Last names do not match');
    return false;
  }

  // Если у автора только фамилия - это может быть совпадение
  if (authorParts.length === 1) {
    console.log('Match: only last name provided');
    return true;
  }

  // Если у автора есть инициалы
  if (authorParts.length >= 2) {
    const authorFirstInitial = authorParts[1].replace('.', '').charAt(0).toLowerCase();
    const userFirstInitial = firstName.charAt(0).toLowerCase();

    console.log('Author first initial:', authorFirstInitial, 'User first initial:', userFirstInitial);

    if (authorFirstInitial !== userFirstInitial) {
      console.log('First initials do not match');
      return false;
    }

    // Если есть второй инициал (отчество)
    if (authorParts.length >= 3 && patronymic) {
      const authorPatronymicInitial = authorParts[2].replace('.', '').charAt(0).toLowerCase();
      const userPatronymicInitial = patronymic.charAt(0).toLowerCase();

      console.log('Author patronymic initial:', authorPatronymicInitial, 'User patronymic initial:', userPatronymicInitial);

      if (authorPatronymicInitial !== userPatronymicInitial) {
        console.log('Patronymic initials do not match');
        return false;
      }
    }

    console.log('Match found!');
    return true;
  }

  console.log('No match found');
  return false;
}

testAuthors.forEach(author => {
  const result = isLikelyMyAuthor(author);
  console.log(`Author: "${author}" => ${result ? 'MATCH' : 'NO MATCH'}`);
});
