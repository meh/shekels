module Component

class Input < Lissio::Component
	on :keydown, 'input' do |e|
		next unless e.key == :Enter

		if e.target.value.empty?
			Shekels.navigate('/')
			next
		end

		words = e.target.value.split(/\s+/)
		first = words.first.downcase

		case first
		when /^\d+(\.\d+)?$/
			amount = words.shift.to_f
			first  = words.shift

			name, *rest = words.slice_before("for").to_a
			name = name.join(' ')
			rest = rest.flatten.drop(1).join(' ')

			case first
			when :for
				Payment.new(for: words.join(' '), amount: amount, sign: :-).create {
					Shekels.refresh
				}

			when :to
				Person.new(name: name).create {
					Payment.new(recipient: Person.new(name: name), for: (rest unless rest.empty?), amount: amount, sign: :-).create {
						Shekels.refresh
					}
				}

			when :from
				Person.new(name: name).create {
					Payment.new(recipient: Person.new(name: name), for: (rest unless rest.empty?), amount: amount, sign: :+).create {
						Shekels.refresh
					}
				}

			end

		when :for

		when :to

		when :from

		else
			name = words.join(' ')

			Payments.fetch(name: name) {|p|
				if Payments === p && !p.empty?
					p = p.first

					if Person === p.recipient
						Shekels.navigate("/person/#{words.join(' ')}")
					else
						Shekels.navigate("/item/#{words.join(' ')}")
					end
				else
					Shekels.page.render Danger.new("Unknown recipient.")
				end
			}
		end

		e.target.clear
	end

	element '#input'

	html do
		div.shekel '₪'
		input.place_holder(["2.30 from John", "13.37 to Richard", "42 for groceries"].sample)
	end

	css do
		rule '#input' do
			rule '.shekel' do
				display 'inline-block'

				border 1.px, :solid, '#555'
				border right: :none

				padding left: 4.px,
				        right: 4.px,
				        top: 3.px,
				        bottom: 3.px
			end

			rule 'input' do
				display 'inline-block'

				background '#fff'
				color '#222'

				border 1.px, :solid, '#555'
				border left: :none

				padding 3.px
				width 32.ch
			end
		end
	end
end

end
