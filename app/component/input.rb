module Component

class Input < Lissio::Component
	NUMBER = /^\d+(\.\d+)$/

	on :keydown, 'input' do |e|
		next unless e.key == :Enter

		words = e.target.value.split(/\s+/)
		first = words.first.downcase

		case
		when first =~ NUMBER

		when first == :for

		when first == :to

		when first == :from

		else
			name = words.join(' ')

			Payments.fetch(name: name) {|p|
				if Payments === p && !p.empty?
					p = p.first

					if Person === p.for
						Shekels.navigate("/person/#{words.join(' ')}")
					else
						Shekels.navigate("/item/#{words.join(' ')}")
					end
				else
					Shekels.page.render Lissio::Alert::Danger.new("Unknown recipient.")
				end
			}
		end
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
