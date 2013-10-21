module Component

class Page < Lissio::Component
	def go(page, data = nil)
		case page
		when :index
			Payments.fetch {|payments|
				if not Payments === payments
					render Lissio::Alert::Danger.new "Failed to load payments."
				elsif payments.empty?
					render Lissio::Alert.new "No payments."
				else
					render Table.new(self) {
						columns :amount, :recipient, :action

						rows(*payments.map {|payment|
							{ recipient: payment.for.name,
							  amount:    payment.amount }
						})
					}
				end
			}

		when :person

		when :item
		end
	end

	def render(*content)
		content = [*@content] if content.empty?
		content.compact! # FIXME: when it's fixed

		element.clear

		content.each {|c|
			if String === c
				element << c
			else
				element << (c.render; c.element)
			end
		}
	end

	element '#page'

	css do
		rule '#page' do
			width 500.px
			margin 40.px, :auto
		end
	end
end

end
